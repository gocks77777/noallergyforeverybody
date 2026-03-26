"""
verify_mapping.py — W2 label_ingredient_map.json 검증 스크립트

확인 항목:
  1. AI Hub 150 클래스 전부 매핑 존재 여부
  2. 알레르기 누락 여부 (재료 있는데 알레르기 비어있는 클래스)
  3. 클래스별 재료 수 분포
  4. 알레르기별 음식 수 통계

사용법:
  python scripts/verify_mapping.py
"""

import json
from collections import Counter

MAP_PATH    = "D:/noallergyforeveryone/data/label_ingredient_map.json"
KFOOD_PATH  = "D:/noallergyforeveryone/kfood_classes_full.json"

# 한국 식품공전 22종 알레르기
KNOWN_ALLERGENS = {
    "난류", "우유", "메밀", "땅콩", "대두", "밀", "고등어", "게", "새우",
    "돼지고기", "복숭아", "토마토", "아황산류", "호두", "닭고기", "쇠고기",
    "오징어", "굴", "전복", "홍합", "잣", "조개",
}

# ── 로드 ──────────────────────────────────────────────────
with open(MAP_PATH, encoding="utf-8") as f:
    ing_map = json.load(f)

with open(KFOOD_PATH, encoding="utf-8") as f:
    kfood = json.load(f)

aihub_classes = [food for foods in kfood["categories"].values() for food in foods]

print("=" * 55)
print("  label_ingredient_map.json 검증 리포트")
print("=" * 55)

# ── 1. AI Hub 클래스 커버리지 ─────────────────────────────
missing = [c for c in aihub_classes if c not in ing_map]
print(f"\n[1] AI Hub 클래스 커버리지")
print(f"    전체: {len(aihub_classes)}개 | 매핑됨: {len(aihub_classes)-len(missing)}개 | 누락: {len(missing)}개")
if missing:
    print(f"    누락 클래스: {missing}")
else:
    print("    ✅ 전부 커버")

# ── 2. 알레르기 누락 체크 ─────────────────────────────────
print(f"\n[2] 알레르기 누락 클래스 (재료 있는데 알레르기 비어있음)")
empty_allergen = [
    k for k, v in ing_map.items()
    if v["ingredients"] and not v["allergens"]
]
if empty_allergen:
    for cls in empty_allergen:
        print(f"    ⚠️  {cls}: {ing_map[cls]['ingredients']}")
else:
    print("    ✅ 없음")

# ── 3. 알 수 없는 알레르기 태그 체크 ─────────────────────
print(f"\n[3] 비표준 알레르기 태그")
unknown_tags = set()
for v in ing_map.values():
    for a in v["allergens"]:
        if a not in KNOWN_ALLERGENS:
            unknown_tags.add(a)
if unknown_tags:
    print(f"    ⚠️  {unknown_tags}")
else:
    print("    ✅ 없음")

# ── 4. 재료 수 분포 ───────────────────────────────────────
ing_counts = [len(v["ingredients"]) for v in ing_map.values()]
print(f"\n[4] 클래스당 재료 수")
print(f"    최소: {min(ing_counts)}  최대: {max(ing_counts)}  평균: {sum(ing_counts)/len(ing_counts):.1f}")
few = [(k, len(v["ingredients"])) for k, v in ing_map.items() if len(v["ingredients"]) < 3]
if few:
    print(f"    ⚠️  재료 3개 미만: {few}")

# ── 5. 알레르기별 음식 수 통계 ───────────────────────────
print(f"\n[5] 알레르기별 해당 음식 수 (상위 10개)")
allergen_counter = Counter()
for v in ing_map.values():
    for a in v["allergens"]:
        allergen_counter[a] += 1

for allergen, count in allergen_counter.most_common(10):
    bar = "█" * (count // 3)
    print(f"    {allergen:10s} {count:3d}개  {bar}")

# ── 6. 최종 요약 ─────────────────────────────────────────
print(f"\n{'='*55}")
issues = len(missing) + len(empty_allergen) + len(unknown_tags)
if issues == 0:
    print("✅ 모든 검증 통과! W3 학습 진행 가능합니다.")
else:
    print(f"⚠️  {issues}개 항목 확인 필요")
print(f"{'='*55}\n")
