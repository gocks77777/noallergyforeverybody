"""
preprocess.py — AI Hub 한국 음식 데이터 전처리 파이프라인

입력: D:/noallergyforeveryone/ai허브 음식데이터/한국 음식 이미지/kfood.zip
출력: D:/noallergyforeveryone/data/processed/{클래스명}/{이미지}.jpg
      D:/noallergyforeveryone/data/processed/stats.json

처리 단계:
  1. 중첩 zip 압축 해제 (kfood.zip → 카테고리.zip → 이미지)
  2. 블러 이미지 제거 (Laplacian variance < 100)
  3. 중복 이미지 제거 (MD5 해시)
  4. 224×224 리사이즈 + JPEG 저장 (quality=85)
"""

import cv2
import hashlib
import io
import json
import os
import zipfile
from collections import defaultdict
from tqdm import tqdm

# ── 경로 설정 ──────────────────────────────────────────────
ZIP_PATH   = "D:/noallergyforeveryone/ai허브 음식데이터/한국 음식 이미지/kfood.zip"
OUTPUT_DIR = "D:/noallergyforeveryone/data/processed"
STATS_PATH = "D:/noallergyforeveryone/data/processed/stats.json"

# ── 전처리 파라미터 ────────────────────────────────────────
IMG_SIZE       = 224
BLUR_THRESHOLD = 100   # Laplacian variance 이 값 미만이면 블러로 판단
JPEG_QUALITY   = 85

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── 통계 ──────────────────────────────────────────────────
stats = defaultdict(lambda: {"total": 0, "saved": 0, "blur": 0, "dup": 0})
seen_hashes = set()


def is_blurry(img_gray) -> bool:
    return cv2.Laplacian(img_gray, cv2.CV_64F).var() < BLUR_THRESHOLD


def md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def process_image(img_bytes: bytes, class_name: str, filename: str) -> str | None:
    """
    이미지 바이트 처리 후 저장.
    반환: 'saved' | 'blur' | 'dup' | 'error'
    """
    stats[class_name]["total"] += 1

    # 중복 제거
    h = md5(img_bytes)
    if h in seen_hashes:
        stats[class_name]["dup"] += 1
        return "dup"
    seen_hashes.add(h)

    # 디코딩
    nparr = __import__("numpy").frombuffer(img_bytes, __import__("numpy").uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return "error"

    # 블러 제거
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if is_blurry(gray):
        stats[class_name]["blur"] += 1
        return "blur"

    # 리사이즈
    img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)

    # 저장 (cv2.imwrite는 Windows 한글 경로 미지원 → imencode로 우회)
    out_dir = os.path.join(OUTPUT_DIR, class_name)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, filename)
    ok, buf = cv2.imencode(".jpg", img_resized, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
    if not ok:
        return "error"
    with open(out_path, "wb") as f:
        f.write(buf.tobytes())

    stats[class_name]["saved"] += 1
    return "saved"


# ── 메인 처리 ──────────────────────────────────────────────
print(f"ZIP 열기: {ZIP_PATH}")
outer = zipfile.ZipFile(ZIP_PATH)
cat_zips = outer.namelist()
print(f"카테고리 수: {len(cat_zips)}")

for cat_zip_name in cat_zips:
    cat_name = cat_zip_name.replace(".zip", "")
    print(f"\n[{cat_name}] 처리 중...")

    inner_bytes = outer.read(cat_zip_name)
    inner = zipfile.ZipFile(io.BytesIO(inner_bytes))
    inner_names = [n for n in inner.namelist() if n.lower().endswith((".jpg", ".jpeg", ".png"))]

    for img_path in tqdm(inner_names, desc=cat_name, unit="img"):
        parts = img_path.split("/")
        if len(parts) < 3:
            continue
        class_name = parts[1]   # 카테고리/클래스명/파일.jpg
        filename   = parts[2].rsplit(".", 1)[0] + ".jpg"

        img_bytes = inner.read(img_path)
        process_image(img_bytes, class_name, filename)

    inner.close()

outer.close()

# ── 통계 저장 ──────────────────────────────────────────────
total_saved = sum(v["saved"] for v in stats.values())
total_blur  = sum(v["blur"]  for v in stats.values())
total_dup   = sum(v["dup"]   for v in stats.values())
total_in    = sum(v["total"] for v in stats.values())

summary = {
    "total_input":  total_in,
    "total_saved":  total_saved,
    "total_blur":   total_blur,
    "total_dup":    total_dup,
    "classes":      len(stats),
    "per_class":    dict(stats),
}

with open(STATS_PATH, "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print(f"""
═══════════════════════════════
전처리 완료
  입력:   {total_in:,}장
  저장:   {total_saved:,}장
  블러:   {total_blur:,}장 제거
  중복:   {total_dup:,}장 제거
  클래스: {len(stats)}개
  출력:   {OUTPUT_DIR}
═══════════════════════════════
""")
