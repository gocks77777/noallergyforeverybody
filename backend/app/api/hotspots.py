"""
GET /hotspots
외국인 밀집 지역 알레르기 위험 경보 (OA-14993 + OA-20918)
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.data import load_foreign_population, get_allergen_foods_for_dong

router = APIRouter()

TOP_N = 20


class Hotspot(BaseModel):
    dong_name: str
    dong_code: str
    foreign_count: float
    risk_level: str             # high / medium / low
    top_allergen_foods: list[str]


@router.get("", response_model=list[Hotspot])
def get_hotspots():
    population = load_foreign_population()
    if not population:
        return []

    # 외국인 수 내림차순 상위 TOP_N
    top_dongs = sorted(population, key=lambda x: x["foreign_count"], reverse=True)[:TOP_N]

    # 상대적 threshold (상위 데이터 기준)
    if top_dongs:
        max_count = top_dongs[0]["foreign_count"]
        high_threshold = max_count * 0.5
        medium_threshold = max_count * 0.2
    else:
        high_threshold = 5000
        medium_threshold = 1000

    result = []
    for dong in top_dongs:
        count = dong["foreign_count"]
        if count >= high_threshold:
            risk = "high"
        elif count >= medium_threshold:
            risk = "medium"
        else:
            risk = "low"

        result.append(Hotspot(
            dong_name=dong["dong_name"],
            dong_code=dong["dong_code"],
            foreign_count=round(count),
            risk_level=risk,
            top_allergen_foods=get_allergen_foods_for_dong(dong["dong_code"], limit=5),
        ))

    return result
