"""
GET /barcode/{code}
바코드 → 1차: Open Food Facts / 2차: 식품안전나라 API → 성분 + 알레르기
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OFF_URL = "https://world.openfoodfacts.org/api/v0/product/{code}.json"
KFOOD_URL = "https://openapi.foodsafetykorea.go.kr/api/{key}/C005/json/1/1/BAR_CD={code}"
KFOOD_KEY = os.getenv("KFOOD_API_KEY", "")


class BarcodeResponse(BaseModel):
    barcode: str
    product_name: str
    allergens: list[str]
    ingredients_text: str
    labels: list[str]
    source: str  # "openfoodfacts" or "foodsafetykorea"


async def _try_openfoodfacts(code: str, client: httpx.AsyncClient) -> BarcodeResponse | None:
    try:
        res = await client.get(OFF_URL.format(code=code))
        if res.status_code != 200:
            return None
        data = res.json()
        if data.get("status") != 1:
            return None
        product = data["product"]
        return BarcodeResponse(
            barcode=code,
            product_name=product.get("product_name", ""),
            allergens=product.get("allergens_tags", []),
            ingredients_text=product.get("ingredients_text", ""),
            labels=product.get("labels_tags", []),
            source="openfoodfacts",
        )
    except Exception:
        return None


async def _try_foodsafetykorea(code: str, client: httpx.AsyncClient) -> BarcodeResponse | None:
    if not KFOOD_KEY:
        return None
    try:
        res = await client.get(KFOOD_URL.format(key=KFOOD_KEY, code=code))
        if res.status_code != 200:
            return None
        data = res.json()
        rows = data.get("C005", {}).get("row", [])
        if not rows:
            return None
        row = rows[0]
        # 원재료명에서 알레르기 유발 물질 추출
        raw = row.get("RAWMTRL_NM", "")
        allergens = _extract_korean_allergens(raw)
        return BarcodeResponse(
            barcode=code,
            product_name=row.get("PRDLST_NM", ""),
            allergens=allergens,
            ingredients_text=raw,
            labels=[row.get("PRDLST_DCNM", "")],
            source="foodsafetykorea",
        )
    except Exception:
        return None


KOREAN_ALLERGENS = [
    "계란", "우유", "메밀", "땅콩", "대두", "밀", "고등어", "게",
    "새우", "돼지고기", "복숭아", "토마토", "아황산류", "호두",
    "닭고기", "쇠고기", "오징어", "조개류", "잣",
]


def _extract_korean_allergens(raw_materials: str) -> list[str]:
    return [a for a in KOREAN_ALLERGENS if a in raw_materials]


@router.get("/{code}", response_model=BarcodeResponse)
async def get_barcode(code: str):
    async with httpx.AsyncClient(timeout=5) as client:
        # 1차: Open Food Facts
        result = await _try_openfoodfacts(code, client)
        if result:
            return result

        # 2차: 식품안전나라 (한국 제품)
        result = await _try_foodsafetykorea(code, client)
        if result:
            return result

    raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")
