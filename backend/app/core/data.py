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

# 행정동코드 → 행정동명 매핑 (서울시 주요 행정동)
DONG_NAMES = {
    "11110515": "소공동", "11110530": "회현동", "11110540": "명동",
    "11110550": "필동", "11110560": "장충동", "11110570": "광희동",
    "11110580": "을지로동", "11110600": "신당동", "11110610": "다산동",
    "11110620": "약수동", "11110630": "청구동", "11110640": "동화동",
    "11110650": "황학동", "11110660": "중림동",
    "11140510": "후암동", "11140520": "용산2가동", "11140530": "남영동",
    "11140540": "청파동", "11140550": "원효로1동", "11140560": "원효로2동",
    "11140570": "효창동", "11140580": "용문동", "11140590": "한강로동",
    "11140600": "이촌1동", "11140610": "이촌2동", "11140620": "이태원1동",
    "11140630": "이태원2동", "11140640": "한남동", "11140650": "서빙고동",
    "11140660": "보광동",
    "11170710": "종로1.2.3.4가동", "11170720": "종로5.6가동",
    "11170730": "이화동", "11170740": "혜화동",
    "11200510": "서교동", "11200520": "합정동", "11200530": "망원1동",
    "11200540": "망원2동", "11200550": "연남동", "11200560": "성산1동",
    "11200570": "성산2동", "11200580": "상수동", "11200590": "홍은1동",
    "11200600": "홍은2동", "11200610": "홍제1동", "11200620": "홍제2동",
    "11200630": "홍제3동",
    "11350560": "잠실본동", "11350570": "잠실2동", "11350580": "잠실3동",
    "11350590": "잠실4동", "11350600": "잠실6동", "11350610": "잠실7동",
    "11680610": "역삼1동", "11680620": "역삼2동", "11680630": "개포1동",
    "11680640": "개포2동", "11680650": "개포4동",
}


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
        dong_name = DONG_NAMES.get(dong_code, dong_code)
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
