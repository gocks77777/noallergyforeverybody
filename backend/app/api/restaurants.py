"""
GET /restaurants
위치 기반 주변 식당 목록 (OA-16094)
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.data import get_nearby_restaurants

router = APIRouter()


class Restaurant(BaseModel):
    name: str
    address: str
    category: str
    lat: float
    lng: float


@router.get("", response_model=list[Restaurant])
async def get_restaurants(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    radius: int = Query(500, description="반경(m)", ge=100, le=5000),
):
    rows = get_nearby_restaurants(lat, lng, radius)
    return [Restaurant(**r) for r in rows]
