"""
OA-20918 (서울시 공공급식 상위 식재료) 기반
label_ingredient_map.json 생성 스크립트

출력 파일:
  data/ingredient_allergen_map.json  - 식재료명 → 알레르기 유발 성분 목록
  data/label_ingredient_map.json     - 한국 음식명 → 주요 식재료 + 알레르기 목록
"""

import csv
import json
import os
import re

# ── 경로 설정 ──────────────────────────────────────────────
CSV_PATH = "D:/noallergyforeveryone/서울시 공공급식 상위(대표)식재료 정보.csv"
OUT_DIR = "D:/noallergyforeveryone/data"
os.makedirs(OUT_DIR, exist_ok=True)

# ── 한국 식품공전 알레르기 유발 22종 ───────────────────────
ALLERGEN_KEYWORDS = {
    "난류":     ["난류", "계란", "달걀", "egg"],
    "우유":     ["우유", "유제품", "milk", "lactose", "유청", "버터", "치즈"],
    "메밀":     ["메밀", "buckwheat"],
    "땅콩":     ["땅콩", "peanut"],
    "대두":     ["대두", "콩", "두부", "된장", "간장", "soybean", "soy"],
    "밀":       ["밀", "밀가루", "글루텐", "wheat", "gluten", "면", "빵가루"],
    "고등어":   ["고등어", "mackerel"],
    "게":       ["게", "crab"],
    "새우":     ["새우", "shrimp", "prawn"],
    "돼지고기": ["돼지", "돼지고기", "pork", "베이컨", "햄"],
    "복숭아":   ["복숭아", "peach"],
    "토마토":   ["토마토", "tomato"],
    "아황산류": ["아황산", "이산화황", "sulfite", "sulphite"],
    "호두":     ["호두", "walnut"],
    "닭고기":   ["닭", "닭고기", "chicken"],
    "쇠고기":   ["쇠고기", "소고기", "beef", "牛"],
    "오징어":   ["오징어", "squid"],
    "굴":       ["굴", "oyster"],
    "전복":     ["전복", "abalone"],
    "홍합":     ["홍합", "mussel"],
    "잣":       ["잣", "pine nut"],
    "조개":     ["조개", "clam", "shellfish"],
}

def detect_allergens(text: str) -> list[str]:
    """텍스트에서 알레르기 유발 성분 탐지"""
    text_lower = text.lower()
    found = []
    for allergen, keywords in ALLERGEN_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(allergen)
    return found

def parse_description(desc: str) -> list[str]:
    """설명 필드에서 성분 토큰 추출 (/ 구분)"""
    if not desc:
        return []
    tokens = [t.strip() for t in re.split(r"[/,]", desc)]
    # 용량·인증·브랜드 등 노이즈 제거
    noise = {"haccp", "kg", "g", "ml", "l", "냉장", "냉동", "국내산", "수입산",
             "유기농", "무항생제", "단품", "낱개", "개", "봉", "팩"}
    cleaned = []
    for t in tokens:
        t_clean = t.strip()
        if not t_clean:
            continue
        if t_clean.lower() in noise:
            continue
        if re.fullmatch(r"[\d.]+", t_clean):  # 숫자만
            continue
        cleaned.append(t_clean)
    return cleaned


# ── 1. OA-20918 파싱 → ingredient_allergen_map ────────────
print("OA-20918 파싱 중...")
ingredient_map = {}  # 식재료명 → {sub_ingredients, allergens}

with open(CSV_PATH, encoding="cp949") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["상위식재료명"].strip()
        desc = row["설명"].strip()
        category = row["대분류명"].strip()

        sub_ingredients = parse_description(desc)
        full_text = name + " " + desc
        allergens = detect_allergens(full_text)

        ingredient_map[name] = {
            "category": category,
            "sub_ingredients": sub_ingredients,
            "allergens": allergens,
        }

print(f"  식재료 수: {len(ingredient_map)}")

# 저장
with open(f"{OUT_DIR}/ingredient_allergen_map.json", "w", encoding="utf-8") as f:
    json.dump(ingredient_map, f, ensure_ascii=False, indent=2)
print(f"  → {OUT_DIR}/ingredient_allergen_map.json 저장 완료")


# ── 2. 한국 음식 200 클래스 → 식재료 + 알레르기 매핑 ──────
# AI Hub 승인 전 임시: 대표 한국 음식 70종 직접 정의
# AI Hub 데이터 수신 후 나머지 클래스 추가 예정

KOREAN_FOOD_INGREDIENTS = {
    "김치찌개":     ["김치", "돼지고기", "두부", "고춧가루", "마늘", "파", "된장"],
    "된장찌개":     ["된장", "두부", "애호박", "버섯", "마늘", "파", "대두"],
    "순두부찌개":   ["순두부", "고춧가루", "돼지고기", "마늘", "파", "계란"],
    "부대찌개":     ["햄", "소시지", "두부", "김치", "라면", "고춧가루", "밀"],
    "삼겹살":       ["돼지고기", "마늘", "쌈장", "깻잎"],
    "불고기":       ["쇠고기", "간장", "대두", "설탕", "마늘", "참기름", "배"],
    "갈비":         ["쇠고기", "간장", "대두", "마늘", "배", "참기름"],
    "갈비탕":       ["쇠고기", "대파", "마늘", "소금"],
    "설렁탕":       ["쇠고기", "대파", "마늘", "소금", "밥"],
    "곰탕":         ["쇠고기", "대파", "마늘", "소금"],
    "육개장":       ["쇠고기", "고사리", "대파", "고춧가루", "숙주"],
    "해장국":       ["쇠고기", "콩나물", "대파", "고춧가루", "선지"],
    "삼계탕":       ["닭고기", "찹쌀", "인삼", "마늘", "대추"],
    "닭갈비":       ["닭고기", "고춧가루", "간장", "대두", "떡", "밀", "양배추"],
    "찜닭":         ["닭고기", "간장", "대두", "감자", "당근", "당면", "마늘"],
    "치킨":         ["닭고기", "밀가루", "밀", "식용유", "소금", "후추"],
    "비빔밥":       ["쌀", "나물", "고추장", "계란", "참기름", "쇠고기"],
    "볶음밥":       ["쌀", "계란", "간장", "대두", "파"],
    "김밥":         ["쌀", "김", "계란", "게맛살", "시금치", "당근", "우엉"],
    "떡볶이":       ["떡", "밀", "고추장", "어묵", "대두", "대파"],
    "순대":         ["돼지고기", "당면", "밀", "선지", "부추"],
    "어묵":         ["생선", "밀가루", "밀", "전분"],
    "라면":         ["밀", "밀가루", "간장", "대두", "계란", "파"],
    "냉면":         ["메밀", "밀", "쇠고기", "계란", "오이", "배"],
    "막국수":       ["메밀", "김치", "참기름", "고춧가루", "계란"],
    "잡채":         ["당면", "돼지고기", "시금치", "당근", "간장", "대두", "계란"],
    "japchae":      ["당면", "돼지고기", "시금치", "당근", "간장", "대두", "계란"],
    "김치":         ["배추", "고춧가루", "마늘", "생강", "젓갈", "새우"],
    "깍두기":       ["무", "고춧가루", "마늘", "생강", "젓갈", "새우"],
    "된장":         ["대두", "소금"],
    "고추장":       ["고춧가루", "찹쌀", "대두", "메주"],
    "간장":         ["대두", "소금"],
    "삼겹살구이":   ["돼지고기", "마늘", "쌈장"],
    "제육볶음":     ["돼지고기", "고추장", "간장", "대두", "마늘", "양파"],
    "돼지불백":     ["돼지고기", "간장", "대두", "마늘", "양파"],
    "보쌈":         ["돼지고기", "새우젓", "새우", "배추"],
    "족발":         ["돼지고기", "간장", "대두", "마늘"],
    "순대국밥":     ["돼지고기", "당면", "밀", "선지"],
    "해물파전":     ["밀가루", "밀", "계란", "새우", "오징어", "조개", "파"],
    "빈대떡":       ["녹두", "돼지고기", "김치", "숙주"],
    "호떡":         ["밀가루", "밀", "설탕", "계피", "땅콩"],
    "약과":         ["밀가루", "밀", "꿀", "참기름", "계피"],
    "식혜":         ["쌀", "엿기름"],
    "수정과":       ["계피", "생강", "설탕", "잣"],
    "수제비":       ["밀가루", "밀", "감자", "애호박", "바지락", "조개"],
    "칼국수":       ["밀가루", "밀", "닭고기", "애호박", "대파"],
    "우동":         ["밀가루", "밀", "간장", "대두", "어묵", "파"],
    "콩국수":       ["대두", "콩", "밀가루", "밀", "오이"],
    "물냉면":       ["메밀", "밀", "쇠고기", "계란", "오이"],
    "비빔냉면":     ["메밀", "밀", "고추장", "계란", "오이", "쇠고기"],
    "kimbap":       ["쌀", "김", "계란", "게맛살", "시금치"],
    "tteokbokki":   ["떡", "밀", "고추장", "어묵", "대두"],
    "bibimbap":     ["쌀", "나물", "고추장", "계란", "쇠고기"],
    "bulgogi":      ["쇠고기", "간장", "대두", "마늘", "배"],
    "kimchi":       ["배추", "고춧가루", "마늘", "생강", "새우"],
    "doenjang_jjigae": ["된장", "두부", "대두", "애호박", "마늘"],
    "samgyeopsal":  ["돼지고기", "마늘", "쌈장"],
    "galbi":        ["쇠고기", "간장", "대두", "마늘"],
    "japchae_noodle": ["당면", "돼지고기", "간장", "대두", "계란"],
    "haemul_pajeon": ["밀가루", "밀", "계란", "새우", "오징어", "파"],
    "sundubu_jjigae": ["순두부", "대두", "고춧가루", "돼지고기", "계란"],
    "dakgalbi":     ["닭고기", "고추장", "밀", "떡", "양배추"],
    "gimbap":       ["쌀", "김", "계란", "시금치"],
    "naengmyeon":   ["메밀", "밀", "쇠고기", "계란", "오이"],
    "samgyetang":   ["닭고기", "찹쌀", "인삼", "마늘"],
    "budae_jjigae": ["햄", "밀", "두부", "대두", "김치"],
    "yukgaejang":   ["쇠고기", "고춧가루", "대파", "고사리"],
    "jokbal":       ["돼지고기", "간장", "대두", "마늘"],
    "bossam":       ["돼지고기", "새우", "배추"],
    "ramyeon":      ["밀", "간장", "대두", "계란"],
    "sundae":       ["돼지고기", "당면", "밀", "선지"],
    "hotteok":      ["밀가루", "밀", "땅콩", "설탕"],
    "pajeon":       ["밀가루", "밀", "계란", "파", "새우"],
    "bindaetteok":  ["녹두", "돼지고기", "숙주"],
    "jeyuk_bokkeum": ["돼지고기", "고추장", "간장", "대두", "마늘"],
    "galbitang":    ["쇠고기", "대파", "마늘"],
    "seolleongtang": ["쇠고기", "대파", "마늘"],
    "haejang_guk":  ["쇠고기", "콩나물", "고춧가루", "선지"],
}

# 음식별 알레르기 자동 계산
print("\n한국 음식 알레르기 매핑 생성 중...")
label_ingredient_map = {}

for food, ingredients in KOREAN_FOOD_INGREDIENTS.items():
    allergens = set()
    for ing in ingredients:
        # 1. 직접 키워드 매칭
        allergens.update(detect_allergens(ing))
        # 2. OA-20918에 해당 식재료 있으면 거기서도 가져오기
        for key, val in ingredient_map.items():
            if ing in key or key in ing:
                allergens.update(val["allergens"])
                break

    label_ingredient_map[food] = {
        "ingredients": ingredients,
        "allergens": sorted(allergens),
        "source": "manual+OA-20918",
    }

print(f"  음식 클래스 수: {len(label_ingredient_map)}")

# 저장
with open(f"{OUT_DIR}/label_ingredient_map.json", "w", encoding="utf-8") as f:
    json.dump(label_ingredient_map, f, ensure_ascii=False, indent=2)
print(f"  → {OUT_DIR}/label_ingredient_map.json 저장 완료")

# ── 3. 통계 출력 ────────────────────────────────────────────
allergen_counter = {}
for v in label_ingredient_map.values():
    for a in v["allergens"]:
        allergen_counter[a] = allergen_counter.get(a, 0) + 1

print("\n=== 알레르기별 해당 음식 수 ===")
for allergen, count in sorted(allergen_counter.items(), key=lambda x: -x[1]):
    print(f"  {allergen}: {count}개 음식")

print("\n완료!")
