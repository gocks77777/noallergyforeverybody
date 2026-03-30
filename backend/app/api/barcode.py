"""
GET /barcode/{code}
바코드 → 1차: Open Food Facts / 2차: 식품안전나라 + Claude 알레르기 추론
"""
import os
import httpx
import anthropic
from fastapi import APIRouter, HTTPException, Query
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
    source: str  # "openfoodfacts" | "foodsafetykorea" | "foodsafetykorea+claude"


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


async def _try_foodsafetykorea(code: str, client: httpx.AsyncClient) -> dict | None:
    """C005에서 제품명+분류 가져오기 (원재료 없음)"""
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
        return {
            "product_name": row.get("PRDLST_NM", ""),
            "category": row.get("PRDLST_DCNM", ""),
            "manufacturer": row.get("BSSH_NM", ""),
        }
    except Exception:
        return None


def _claude_analyze_product(product_name: str, category: str, manufacturer: str) -> dict:
    """Claude에게 제품명으로 원재료/알레르기 추론 요청"""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"ingredients": "", "allergens": []}

    prompt = (
        f"한국 식품 제품입니다.\n"
        f"제품명: {product_name}\n"
        f"분류: {category}\n"
        f"제조사: {manufacturer}\n\n"
        f"이 제품의 주요 원재료와 포함 가능성이 높은 알레르기 유발 물질을 알려주세요.\n"
        f"반드시 아래 JSON 형식으로만 답하세요:\n"
        f'{{"ingredients": "원재료1, 원재료2, ...", "allergens": ["알레르겐1", "알레르겐2"]}}\n'
        f"알레르겐은 다음 중에서만 선택: 계란, 우유, 메밀, 땅콩, 대두, 밀, 고등어, 게, "
        f"새우, 돼지고기, 복숭아, 토마토, 아황산류, 호두, 닭고기, 쇠고기, 오징어, 조개류, 잣"
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        text = message.content[0].text.strip()
        # JSON 부분만 추출
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return {"ingredients": "", "allergens": []}


@router.get("/{code}", response_model=BarcodeResponse)
async def get_barcode(code: str):
    async with httpx.AsyncClient(timeout=5) as client:
        # 1차: Open Food Facts (해외 제품 - 원재료+알레르기 있음)
        result = await _try_openfoodfacts(code, client)
        if result:
            return result

        # 2차: 식품안전나라 C005 (한국 제품 - 제품명만)
        kfood = await _try_foodsafetykorea(code, client)
        if kfood:
            # 3차: Claude로 제품명 기반 알레르기 추론
            analysis = _claude_analyze_product(
                kfood["product_name"],
                kfood["category"],
                kfood["manufacturer"],
            )
            return BarcodeResponse(
                barcode=code,
                product_name=kfood["product_name"],
                allergens=analysis.get("allergens", []),
                ingredients_text=analysis.get("ingredients", ""),
                labels=[kfood["category"]],
                source="foodsafetykorea+claude",
            )

    raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")
