"""
app/core/data.py — 열린데이터광장 CSV 로더
OA-16094 (음식점), OA-14993 (외국인 생활인구)
"""
import csv
import json
import math
import os
from functools import lru_cache
from typing import Optional

DATA_DIR = os.getenv("DATA_DIR", "data")


def _csv_path(filename: str) -> str:
    return os.path.join(DATA_DIR, filename)


# ── Haversine 거리 (m) ─────────────────────────────────────
def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── OA-16094 음식점 ────────────────────────────────────────
@lru_cache(maxsize=1)
def load_restaurants() -> list[dict]:
    path = _csv_path("seoul_restaurants.csv")
    if not os.path.exists(path):
        return []

    rows = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rows.append({
                    "name":     row.get("사업장명", ""),
                    "address":  row.get("도로명전체주소", row.get("지번주소", "")),
                    "category": row.get("업태구분명", ""),
                    "lat":      float(row["좌표정보y"]),
                    "lng":      float(row["좌표정보x"]),
                })
            except (KeyError, ValueError):
                continue
    return rows


def get_nearby_restaurants(
    lat: float, lng: float, radius: int = 500, limit: int = 20
) -> list[dict]:
    all_rows = load_restaurants()
    nearby = [
        r for r in all_rows
        if haversine(lat, lng, r["lat"], r["lng"]) <= radius
    ]
    nearby.sort(key=lambda r: haversine(lat, lng, r["lat"], r["lng"]))
    return nearby[:limit]


# ── OA-14993 외국인 생활인구 ───────────────────────────────
@lru_cache(maxsize=1)
def load_foreign_population() -> list[dict]:
    path = _csv_path("seoul_foreign_population.csv")
    if not os.path.exists(path):
        return []

    rows = []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rows.append({
                    "dong_name":    row.get("행정동명", ""),
                    "dong_code":    row.get("행정동코드", ""),
                    "foreign_count": float(row.get("외국인생활인구수", 0)),
                })
            except ValueError:
                continue
    return rows


# ── label_ingredient_map ───────────────────────────────────
@lru_cache(maxsize=1)
def load_ingredient_map() -> dict:
    path = _csv_path("label_ingredient_map.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_top_allergen_foods(limit: int = 5) -> list[str]:
    """전체 맵에서 알레르기 해당 음식 상위 N개 반환"""
    ing_map = load_ingredient_map()
    foods_with_allergens = [
        k for k, v in ing_map.items() if v.get("allergens")
    ]
    return foods_with_allergens[:limit]
