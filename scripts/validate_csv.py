"""
validate_csv.py -열린데이터광장 CSV 다운로드 후 컬럼명/데이터 검증

사용법:
  python scripts/validate_csv.py --data_dir backend/data
  python scripts/validate_csv.py --data_dir D:/noallergyforeveryone/backend/data

기대 파일:
  - seoul_restaurants.csv   (OA-16094 일반음식점 인허가)
  - seoul_foreign_population.csv  (OA-14993 외국인 생활인구)
"""
import argparse
import csv
import os
import sys

# 필수 컬럼 정의 (data.py와 일치해야 함)
RESTAURANT_REQUIRED = {"사업장명", "업태구분명"}
RESTAURANT_COORD    = {"좌표정보x", "좌표정보y"}
RESTAURANT_ADDR     = {"도로명전체주소", "지번주소"}  # 최소 1개

FOREIGN_POP_REQUIRED = {"행정동명", "행정동코드", "외국인생활인구수"}


def check_csv(path: str, required: set, description: str) -> dict:
    result = {"path": path, "ok": True, "rows": 0, "errors": []}

    if not os.path.exists(path):
        result["ok"] = False
        result["errors"].append(f"파일 없음: {path}")
        return result

    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = set(reader.fieldnames or [])

        missing = required - headers
        if missing:
            result["ok"] = False
            result["errors"].append(f"필수 컬럼 누락: {missing}")

        rows = 0
        for _ in reader:
            rows += 1
        result["rows"] = rows

    if result["rows"] == 0:
        result["ok"] = False
        result["errors"].append("데이터 0행")

    return result


def main(data_dir: str):
    print(f"\n{'='*55}")
    print(f"열린데이터광장 CSV 검증 -{data_dir}")
    print(f"{'='*55}\n")

    all_ok = True

    # 1) OA-16094 음식점
    rest_path = os.path.join(data_dir, "seoul_restaurants.csv")
    r = check_csv(rest_path, RESTAURANT_REQUIRED | RESTAURANT_COORD, "음식점")
    status = "OK" if r["ok"] else "FAIL"
    print(f"[{status}] OA-16094 음식점: {r['rows']}행")
    if not r["ok"]:
        for e in r["errors"]:
            print(f"       {e}")
        all_ok = False
    else:
        # 추가: 좌표 유효성 샘플 확인
        with open(rest_path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            valid_coords = 0
            for i, row in enumerate(reader):
                if i >= 100:
                    break
                try:
                    lat = float(row.get("좌표정보y", 0))
                    lng = float(row.get("좌표정보x", 0))
                    if 33 < lat < 39 and 124 < lng < 132:
                        valid_coords += 1
                except ValueError:
                    pass
            print(f"       좌표 유효율 (처음 100행): {valid_coords}%")

    # 2) OA-14993 외국인 생활인구
    pop_path = os.path.join(data_dir, "seoul_foreign_population.csv")
    r = check_csv(pop_path, FOREIGN_POP_REQUIRED, "외국인 생활인구")
    status = "OK" if r["ok"] else "FAIL"
    print(f"[{status}] OA-14993 외국인 생활인구: {r['rows']}행")
    if not r["ok"]:
        for e in r["errors"]:
            print(f"       {e}")
        all_ok = False

    print(f"\n{'='*55}")
    if all_ok:
        print("모든 CSV 검증 통과!")
    else:
        print("CSV 파일 다운로드/배치가 필요합니다.")
        print("다운로드: https://data.seoul.go.kr")
        print("  - OA-16094 → seoul_restaurants.csv")
        print("  - OA-14993 → seoul_foreign_population.csv")
    print(f"{'='*55}\n")

    return all_ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="backend/data")
    args = parser.parse_args()
    ok = main(args.data_dir)
    sys.exit(0 if ok else 1)
