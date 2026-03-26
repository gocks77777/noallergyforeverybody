"""
validate_dataset.py
CONTRIBUTING.md PR 리뷰 기준 자동 검증

사용법:
  python scripts/validate_dataset.py --country korea
  python scripts/validate_dataset.py --country japan --data_dir D:/noallergyforeveryone/data/processed
"""

import argparse
import hashlib
import json
import os
import sys

import cv2
import numpy as np

# ── 기준 ──────────────────────────────────────────────────
MIN_IMAGES     = 50       # 클래스당 최소 이미지 수
IMG_SIZE       = 224      # 요구 해상도
BLUR_THRESHOLD = 100      # Laplacian variance 최솟값
ALLOWED_EXT    = {".jpg", ".jpeg", ".png"}


def check_image(path: str) -> dict:
    """이미지 1장 검사. 결과 dict 반환."""
    result = {"path": path, "ok": True, "errors": []}

    img = cv2.imdecode(
        np.frombuffer(open(path, "rb").read(), np.uint8),
        cv2.IMREAD_COLOR,
    )

    if img is None:
        result["ok"] = False
        result["errors"].append("읽기 실패")
        return result

    # 해상도
    h, w = img.shape[:2]
    if h != IMG_SIZE or w != IMG_SIZE:
        result["ok"] = False
        result["errors"].append(f"해상도 {w}×{h} (요구: {IMG_SIZE}×{IMG_SIZE})")

    # 블러
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if lap_var < BLUR_THRESHOLD:
        result["ok"] = False
        result["errors"].append(f"블러 (선명도 {lap_var:.1f} < {BLUR_THRESHOLD})")

    result["hash"] = hashlib.md5(open(path, "rb").read()).hexdigest()
    return result


def validate(data_dir: str, country: str, map_path: str) -> bool:
    country_dir = os.path.join(data_dir, country)

    if not os.path.isdir(country_dir):
        print(f"❌ 폴더 없음: {country_dir}")
        return False

    classes = sorted([
        d for d in os.listdir(country_dir)
        if os.path.isdir(os.path.join(country_dir, d))
    ])

    if not classes:
        print(f"❌ 클래스 폴더 없음: {country_dir}")
        return False

    # label_ingredient_map 로드
    ing_map = {}
    if os.path.exists(map_path):
        with open(map_path, encoding="utf-8") as f:
            ing_map = json.load(f)

    print(f"\n{'='*50}")
    print(f"검증 대상: {country_dir}")
    print(f"클래스 수: {len(classes)}")
    print(f"{'='*50}\n")

    all_hashes = {}
    total_errors = 0
    class_results = []

    for cls in classes:
        cls_dir = os.path.join(country_dir, cls)
        imgs = [
            os.path.join(cls_dir, f)
            for f in os.listdir(cls_dir)
            if os.path.splitext(f)[1].lower() in ALLOWED_EXT
        ]

        cls_errors = []
        cls_hashes = []
        blur_count = 0
        size_err_count = 0

        for img_path in imgs:
            r = check_image(img_path)
            if not r["ok"]:
                cls_errors.append(r)
                if any("블러" in e for e in r["errors"]):
                    blur_count += 1
                if any("해상도" in e for e in r["errors"]):
                    size_err_count += 1

            # 중복 체크
            h = r.get("hash")
            if h:
                if h in all_hashes:
                    cls_errors.append({
                        "path": img_path,
                        "errors": [f"중복 ({all_hashes[h]})"],
                    })
                else:
                    all_hashes[h] = img_path
                cls_hashes.append(h)

        # 이미지 수 부족
        count_ok = len(imgs) >= MIN_IMAGES
        allergen_ok = cls in ing_map

        status = "✅" if (count_ok and allergen_ok and not cls_errors) else "❌"
        issues = []
        if not count_ok:
            issues.append(f"이미지 {len(imgs)}장 (최소 {MIN_IMAGES}장)")
        if not allergen_ok:
            issues.append("label_ingredient_map.json 미등록")
        if blur_count:
            issues.append(f"블러 {blur_count}장")
        if size_err_count:
            issues.append(f"해상도 오류 {size_err_count}장")

        issue_str = " | ".join(issues) if issues else "정상"
        print(f"{status} {cls:25s}  {len(imgs):4d}장  {issue_str}")

        total_errors += len(issues)
        class_results.append({
            "class": cls,
            "count": len(imgs),
            "issues": issues,
        })

    print(f"\n{'='*50}")
    if total_errors == 0:
        print("✅ 모든 검증 통과! PR 제출 가능합니다.")
    else:
        print(f"❌ {total_errors}개 문제 발견. 수정 후 다시 실행하세요.")
    print(f"{'='*50}\n")

    return total_errors == 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--country",  default="korea")
    parser.add_argument("--data_dir", default="D:/noallergyforeveryone/data/processed")
    parser.add_argument("--map_path", default="D:/noallergyforeveryone/data/label_ingredient_map.json")
    args = parser.parse_args()

    ok = validate(args.data_dir, args.country, args.map_path)
    sys.exit(0 if ok else 1)
