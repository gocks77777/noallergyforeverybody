"""
GET /barcode/{code}
바코드 → Open Food Facts API → 성분 + 알레르기
"""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OFF_URL = "https://world.openfoodfacts.org/api/v0/product/{code}.json"


class BarcodeResponse(BaseModel):
    barcode: str
    product_name: str
    allergens: list[str]
    ingredients_text: str
    labels: list[str]


@router.get("/{code}", response_model=BarcodeResponse)
async def get_barcode(code: str):
    async with httpx.AsyncClient(timeout=5) as client:
        res = await client.get(OFF_URL.format(code=code))

    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Open Food Facts 오류")

    data = res.json()
    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다")

    product = data["product"]
    return BarcodeResponse(
        barcode=code,
        product_name=product.get("product_name", ""),
        allergens=product.get("allergens_tags", []),
        ingredients_text=product.get("ingredients_text", ""),
        labels=product.get("labels_tags", []),
    )
