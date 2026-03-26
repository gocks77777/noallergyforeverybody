"""
GET /hotspots
외국인 밀집 지역 알레르기 위험 경보 (OA-14993 + OA-20918)
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.data import load_foreign_population, get_top_allergen_foods

router = APIRouter()

TOP_N = 20          # 상위 N개 행정동
HIGH_THRESHOLD  = 5000
MEDIUM_THRESHOLD = 1000


class Hotspot(BaseModel):
    dong_name: str
    dong_code: str
    foreign_count: float
    risk_level: str             # high / medium / low
    top_allergen_foods: list[str]


@router.get("", response_model=list[Hotspot])
async def get_hotspots():
    population = load_foreign_population()
    if not population:
        return []

    # 외국인 수 내림차순 상위 TOP_N
    top_dongs = sorted(population, key=lambda x: x["foreign_count"], reverse=True)[:TOP_N]
    top_foods = get_top_allergen_foods(limit=5)

    result = []
    for dong in top_dongs:
        count = dong["foreign_count"]
        if count >= HIGH_THRESHOLD:
            risk = "high"
        elif count >= MEDIUM_THRESHOLD:
            risk = "medium"
        else:
            risk = "low"

        result.append(Hotspot(
            dong_name=dong["dong_name"],
            dong_code=dong["dong_code"],
            foreign_count=count,
            risk_level=risk,
            top_allergen_foods=top_foods,
        ))

    return result
