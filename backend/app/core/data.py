"""
app/core/data.py - 열린데이터광장 CSV 로더
OA-16094 (음식점), OA-14993 (외국인 생활인구)
"""
import csv
import json
import math
import os
from functools import lru_cache

DATA_DIR = os.getenv("DATA_DIR", "data")

# 행정동코드 → 행정동명 매핑 (JSON 파일에서 로드)
def _load_dong_names() -> dict[str, str]:
    path = os.path.join(DATA_DIR, "dong_names.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}

DONG_NAMES = _load_dong_names()

# 구 코드 → 구 이름 (fallback용)
GU_NAMES = {
    "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구",
    "11215": "광진구", "11230": "동대문구", "11260": "중랑구", "11290": "성북구",
    "11305": "강북구", "11320": "도봉구", "11350": "노원구", "11380": "은평구",
    "11410": "서대문구", "11440": "마포구", "11470": "양천구", "11500": "강서구",
    "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
    "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구",
    "11740": "강동구",
}


def _get_dong_name(code: str) -> str:
    """행정동코드 → 동명. 매핑 없으면 구 이름이라도 반환."""
    if code in DONG_NAMES:
        return DONG_NAMES[code]
    gu = GU_NAMES.get(code[:5], "")
    if gu:
        return f"{gu} {code[5:]}"
    return code


def _csv_path(filename: str) -> str:
    return os.path.join(DATA_DIR, filename)


def _open_csv(path: str):
    """cp949 또는 utf-8-sig로 CSV 열기 (깨진 문자는 무시)"""
    for enc in ("utf-8-sig", "utf-8"):
        try:
            f = open(path, encoding=enc, errors="strict")
            f.readline()
            f.seek(0)
            return f
        except (UnicodeDecodeError, UnicodeError):
            try:
                f.close()
            except Exception:
                pass
    return open(path, encoding="cp949", errors="replace")


# -- Haversine 거리 (m) --
def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# -- TM 중부원점 (EPSG:2097) → WGS84 변환 --
_transformer = None

def _tm_to_wgs84(x: float, y: float) -> tuple[float, float]:
    global _transformer
    if _transformer is None:
        from pyproj import Transformer
        _transformer = Transformer.from_crs("EPSG:2097", "EPSG:4326", always_xy=True)
    lng, lat = _transformer.transform(x, y)
    return lat, lng


# -- OA-16094 음식점 --
@lru_cache(maxsize=1)
def load_restaurants() -> list[dict]:
    path = _csv_path("seoul_restaurants.csv")
    if not os.path.exists(path):
        return []

    rows = []
    f = _open_csv(path)
    try:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # 영업 중인 곳만
                status = row.get("상세영업상태명", "")
                if "영업" not in status:
                    continue

                x_str = row.get("좌표정보(X)", "").strip()
                y_str = row.get("좌표정보(Y)", "").strip()
                if not x_str or not y_str:
                    continue

                x, y = float(x_str), float(y_str)
                if x == 0 or y == 0:
                    continue

                lat, lng = _tm_to_wgs84(x, y)
                # 서울 범위 체크 (대략)
                if not (37.0 < lat < 38.0 and 126.5 < lng < 127.5):
                    continue

                rows.append({
                    "name": row.get("사업장명", ""),
                    "address": row.get("도로명주소", "") or row.get("지번주소", ""),
                    "category": row.get("업태구분명", ""),
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                })
            except (KeyError, ValueError):
                continue
    finally:
        f.close()

    print(f"[data] 음식점 {len(rows):,}개 로드 완료")
    return rows


def get_nearby_restaurants(
    lat: float, lng: float, radius: int = 500, limit: int = 20
) -> list[dict]:
    all_rows = load_restaurants()
    nearby = []
    for r in all_rows:
        dist = haversine(lat, lng, r["lat"], r["lng"])
        if dist <= radius:
            nearby.append({**r, "_dist": dist})
    nearby.sort(key=lambda r: r["_dist"])
    for r in nearby:
        del r["_dist"]
    return nearby[:limit]


# -- OA-14993 외국인 생활인구 --
@lru_cache(maxsize=1)
def load_foreign_population() -> list[dict]:
    path = _csv_path("seoul_foreign_population.csv")
    if not os.path.exists(path):
        return []

    # 행정동별 외국인 합산 (시간대 무시, 최신 기준일 기준)
    dong_totals: dict[str, float] = {}
    f = _open_csv(path)
    try:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                dong_code = row.get("행정동코드", "").strip()
                chinese = float(row.get("중국인체류인구수", 0) or 0)
                others = float(row.get("중국외외국인체류인구수", 0) or 0)
                foreign_total = chinese + others
                dong_totals[dong_code] = dong_totals.get(dong_code, 0) + foreign_total
            except (ValueError, TypeError):
                continue
    finally:
        f.close()

    rows = []
    for dong_code, total in dong_totals.items():
        dong_name = _get_dong_name(dong_code)
        rows.append({
            "dong_name": dong_name,
            "dong_code": dong_code,
            "foreign_count": round(total, 1),
        })

    print(f"[data] 외국인 생활인구 {len(rows)}개 행정동 로드 완료")
    return rows


# -- label_ingredient_map --
@lru_cache(maxsize=1)
def load_ingredient_map() -> dict:
    path = _csv_path("label_ingredient_map.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_top_allergen_foods(limit: int = 5) -> list[str]:
    ing_map = load_ingredient_map()
    foods_with_allergens = [
        k for k, v in ing_map.items() if v.get("allergens")
    ]
    return foods_with_allergens[:limit]
