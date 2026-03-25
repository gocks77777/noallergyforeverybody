# Project: Allergy Scan (AAS)
**Concept:** 한국 음식 특화 AI 알레르기 안전 가이드 (서울시 데이터 경진대회 창업 부문 출품작)
**Last Updated:** 2026-03-25 (Claude Review v2.0 - 결정사항 확정)

---

## 0. 경진대회 출품 정보 (필수 확인)

| 항목 | 내용 |
|---|---|
| **대회명** | 서울 열린데이터광장 데이터 활용 경진대회 |
| **출품 부문** | **창업 부문** (앱스토어/웹서비스 URL 등록 제출) |
| **접수 마감** | **2026-05-13 (수) 18:00** ← 오늘(03-25)부터 7주 |
| **1차 결과** | 2026-05-22 (금) |
| **2차 결과** | 2026-06-04 (목) |
| **최종 경연** | 2026-07-06 (월), 서울시청 다목적홀 |
| **시상규모** | 2,350만 원 (22팀) / 서울특별시장상 포함 |
| **참가** | 개인 또는 팀 (최대 5인) |

### 창업 부문 필수/가점 조건 체크리스트

| 조건 | 구분 | 충족 방법 |
|---|---|---|
| 열린데이터광장 데이터셋 1건 이상 사용 | **필수** | 서울시 공공급식 식재료 정보 (OA-20918) |
| AI 기술 (STT, 생성형 AI 등) 활용 | **필수** | Claude 3.5 Sonnet API (생성형 AI) + ViT |
| 웹서비스 URL 등록 완료 | **필수** | Vercel 배포 URL (W7 완성 목표) |
| 서로 다른 분야 데이터 1건 이상 결합 | **가점** | 식품(OA-20918) + 인구(OA-14993) 결합 → 외국인 밀집 지역 알레르기 경보 |

> **참여방법:** 서울 열린데이터광장 누리집 > 소식&참여 > 경진대회 전용 메뉴
> **문의:** 창업부문 02-2133-1271 (평일 09:00~18:00)

---

## 0-1. 확정된 핵심 결정사항 (v2.0)

| 항목 | 결정 | 근거 |
|---|---|---|
| 모델 | **ViT-base-patch16-224 확정** | 개발 속도 가장 빠름 + 정확도 최고 (1석2조) |
| 데이터 전략 | **한국 음식 중심 (200 클래스)** | 서울시 데이터 경진대회 출품 |
| 글로벌 확장 | **GitHub 오픈소스 기여 모델** | 각국 커뮤니티가 자국 음식 데이터 추가 |
| Colab | **무료 T4 (16GB)** | 경진대회 제출, 예산 없음 |
| 바코드 API | **Open Food Facts** | 무료, 270만+ 제품, 알레르기 필드 포함 |
| 즉시 할 일 | **AI Hub 신청 오늘 바로** | 승인 1~3주, 지금 시작해야 W3 일정 맞음 |

---

## 1. Executive Summary
- **Core Value:** 한국 음식 사진/바코드로 즉시 알레르기 위험 판별. 글로벌 여행자 + 외국인을 위한 한국 특화 AI.
- **경진대회 컨셉:** "서울 데이터로 만든 한국 음식 AI 알레르기 가이드"
- **Key Features:**
  - 한국 음식 이미지 인식 (ViT, 200 클래스)
  - 바코드 스캔 → 성분표 자동 분석 (Open Food Facts)
  - LLM 알레르기 추론 (Claude 3.5 Sonnet)
  - 다국어 지원 (여행자 대상)
  - GitHub 기여 모델: 각국 커뮤니티가 자국 음식 데이터셋 PR 가능

---

## 2. Technical Stack
- **Backend:** Python 3.10+, FastAPI
- **Frontend:** React, Tailwind CSS, PWA
- **Deep Learning:** PyTorch, HuggingFace Transformers (`ViTForImageClassification`)
- **Model Engine:** ONNX Runtime (INT8 Quantized)
- **Database:** SQLite (캐시), FAISS (임베딩 Vector DB)
- **Infrastructure:** Colab Free T4 (학습), Vercel (프론트), HF Spaces (백엔드)

---

## 3. Deep Learning & Data Strategy

### A. 모델 선택 근거 (확정: ViT-base)

**정확도 비교 (Food-101, 101클래스 기준):**
```
ViT-base:        93% | 개발 난이도: ★☆☆ | CPU 레이턴시: ~1.0s
EfficientNet-B2: 91% | 개발 난이도: ★★☆ | CPU 레이턴시: ~80ms
MobileViT-S:     90% | 개발 난이도: ★★☆ | CPU 레이턴시: ~150ms
EfficientNet-B0: 88% | 개발 난이도: ★★☆ | CPU 레이턴시: ~50ms
```

**ViT 선택 이유:**
1. HuggingFace Trainer API로 파인튜닝 코드 50줄이면 끝 (개발 속도 최빠)
2. 200 한국 음식 클래스 기준 정확도 추정: ~85-88% (경쟁 모델 대비 3-5%p 우세)
3. 경진대회 심사에서 "ViT 기반 멀티모달 AI"가 기술 신뢰도에 유리
4. CPU 레이턴시 ~1s는 경진대회 데모에서 허용 가능한 수준

**Colab Free T4 학습 시간 예측:**
```
한국 음식 데이터 (AI Hub): 200 클래스 × 평균 250장 = ~50,000장
FP16 + Batch 64 기준:
  - 50,000 / 64 = 781 steps/epoch
  - T4 속도: ~200ms/step
  - 10 epochs: 781 × 10 × 0.2s = ~1,562초 ≈ 26분

→ Colab 무료 12시간 세션 내 여유롭게 완료
```

### B. Data Pipeline

**데이터 소스 (한국 음식 중심):**
- **AI Hub 한국 음식 데이터셋:** ~200 클래스, 즉시 신청 필요
  - 신청 URL: `https://www.aihub.or.kr` → "한국 음식 이미지" 검색
  - 승인 기간: 1~3주 → **오늘 신청 안 하면 W3 학습 일정 못 맞춤**
- **AI Hub 대기 중 대체 데이터 (병렬 진행):**
  - Korean Food Dataset (Kaggle): 약 30 클래스, 즉시 사용 가능
  - 직접 크롤링: 구글 이미지 + 네이버 이미지 (각 클래스 50장씩)

**GitHub 글로벌 기여 구조:**
```
allergydata/
├── data/
│   ├── korea/          # 메인 (이 프로젝트에서 관리)
│   │   ├── kimchi/
│   │   ├── bibimbap/
│   │   └── ...
│   ├── japan/          # 커뮤니티 기여 (PR 받는 방식)
│   ├── thailand/
│   └── CONTRIBUTING.md # 각국 기여 가이드라인
```

**Pre-processing:**
```python
# 필터링
if cv2.Laplacian(img, cv2.CV_64F).var() < 100: continue  # 블러 제거
if md5(img) in seen_hashes: continue                       # 중복 제거

# 리사이즈 & 저장
img = cv2.resize(img, (224, 224))
cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 85])
```

- 저장소: Google Drive 마운트 (`/content/drive/MyDrive/allergydata/`)
- 예상 용량: 50,000장 × ~35KB = **~1.75GB** (Drive 15GB 여유)

**클래스 설계:**
- 한국 음식 200 클래스 기준
- 클래스명: 영어 표기 기준 (`kimchi`, `bibimbap`) + `label_map.json`에 한/영/일/중 매핑

### C. Training Hyperparameters (ViT-base, Colab T4 Free 최적화)

| 항목 | 설정값 | 근거 |
|---|---|---|
| Model | `google/vit-base-patch16-224` | 확정 |
| Optimizer | AdamW (weight_decay=0.01) | ViT 표준 |
| Learning Rate | 2e-5 | ViT fine-tuning 표준 |
| LR Schedule | **Cosine Annealing + Warmup 10%** | Constant 대비 후반 안정성 ↑ |
| Batch Size | **64** (FP16 적용 시) | T4 VRAM ~4-5GB 사용 |
| Epochs | 10 + Early Stopping (patience=3) | 과적합 방지 |
| Precision | **FP16 Mixed Precision 필수** | VRAM 절약, 속도 향상 |
| Gradient Checkpointing | 활성화 | OOM 방지 보험 |
| Augmentation | HorizontalFlip, Rotation(15°), ColorJitter, **MixUp(α=0.2)** | 소규모 데이터 과적합 방지 |

**Colab 세션 보호 전략 (무료 12시간 제한):**
```python
# 에폭마다 Drive에 체크포인트 저장
from transformers import TrainingArguments

training_args = TrainingArguments(
    output_dir="/content/drive/MyDrive/allergydata/checkpoints",
    save_strategy="epoch",        # 에폭마다 저장
    save_total_limit=3,           # 최근 3개만 유지
    load_best_model_at_end=True,
    fp16=True,                    # FP16 필수
    per_device_train_batch_size=64,
    warmup_ratio=0.1,
    lr_scheduler_type="cosine",
    num_train_epochs=10,
)
```

### D. Model Optimization

- **변환:** PyTorch (.pth) → ONNX → INT8 Quantization
- **목표 레이턴시:** CPU ~1.0s (HF Spaces 무료 기준, 경진대회 데모 허용 범위)
- **경진대회 이후 프로덕션화 시:** EfficientNet-B2로 재학습 고려 (정확도 2% 희생, 레이턴시 10배 개선)

---

## 4. Intelligent Logic: "Hybrid Reasoning"

### 아키텍처
```
[이미지 입력]
     ↓
[ViT 임베딩 추출]
     ↓
[FAISS 검색] → 음식명 (top-3 후보)
     ↓
[Claude 3.5 Sonnet]
  입력: 음식명 + 사용자 알레르기 프로필
  출력: 주요 성분 / 숨겨진 위험 / 교차오염 경고
     ↓
[SQLite 캐시 저장] → 동일 (음식명 + 알레르기) 재요청 시 $0
```

**FAISS 인덱스 구조:**
- 클래스 centroid만 저장 (200 클래스 × 768dim = ~230KB, 매우 가벼움)
- `IndexFlatL2` (200 클래스 수준에서 IVFFlat 불필요, 단순하게)

### Claude API 비용 예측 (경진대회 데모 스케일)
```
쿼리당 비용: ~$0.008 (캐시 미스 시)
심사/데모 기간 예상: 하루 50쿼리 × 30일 = 1,500쿼리
캐시 히트율 70% 가정 → 450 고유쿼리
총 비용: 450 × $0.008 = $3.6 (경진대회 기간 전체)
→ 완전히 감당 가능
```

---

## 5. Infrastructure

### HF Spaces 콜드스타트 문제 해결
```javascript
// Vercel Cron Job (vercel.json)
{
  "crons": [{
    "path": "/api/warmup",        // HF Spaces 헬스체크 ping
    "schedule": "*/5 * * * *"     // 5분마다 실행
  }]
}
```

### 열린데이터광장 데이터 연동 (창업 부문 필수/가점)

| 데이터셋 | ID | 분야 | 역할 |
|---|---|---|---|
| 서울시 공공급식 상위 식재료 정보 | OA-20918 | **식품** | 음식명 → 재료 매핑, Claude 프롬프트 컨텍스트 주입 |
| 서울시 일반음식점 인허가 정보 | OA-16094 | **행정/산업** | 주변 식당 지도 + 업종별 필터링 |
| 행정동 단위 서울 생활인구 (단기체류 외국인) | OA-14993 | **인구** | 외국인 관광객 밀집 지역 → 알레르기 위험 경보 우선순위 결정 |

**가점 핵심 로직 — 식품(OA-20918) + 인구(OA-14993) 분야 결합:**
```
외국인 생활인구 데이터 (행정동별 단기체류 외국인 수)
        ↓
명동 > 홍대 > 이태원 순 외국인 밀집도 랭킹 산출
        ↓
해당 동네 일반음식점 + 공공급식 식재료 알레르기 정보 결합
        ↓
앱 기능: "현재 위치 주변 외국인 밀집 지역의 알레르기 주의 음식 TOP 5"
```

```python
# 공공급식 식재료 → Claude 프롬프트 컨텍스트 주입 예시
def build_claude_prompt(food_name: str, user_allergies: list, ingredient_map: dict):
    ingredients = ingredient_map.get(food_name, [])
    return f"""
음식: {food_name}
주요 식재료 (서울시 공공급식 데이터 기반): {', '.join(ingredients)}
사용자 알레르기: {', '.join(user_allergies)}
→ 알레르기 위험 여부와 숨겨진 위험 성분을 분석해주세요.
"""

# 외국인 생활인구 기반 지역 위험도 산출 예시
def get_area_risk_level(dong_code: str, population_data: dict) -> str:
    foreign_count = population_data.get(dong_code, 0)
    if foreign_count > 5000: return "high"    # 명동, 홍대 등
    if foreign_count > 1000: return "medium"
    return "low"
```

**심사 서류 문구:**
> "서울시 공공급식 식재료(식품분야) + 행정동별 단기체류 외국인 생활인구(인구분야)를 결합하여, 외국인 관광객 밀집 지역에서의 알레르기 위험 음식을 우선 안내하는 맞춤형 경보 시스템을 구현했습니다."

### 바코드 API (확정: Open Food Facts)
```python
import requests

def get_product_allergens(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    res = requests.get(url, timeout=5)
    product = res.json().get("product", {})
    return {
        "allergens": product.get("allergens_tags", []),
        "ingredients": product.get("ingredients_text", ""),
        "labels": product.get("labels_tags", [])
    }
```

---

## 6. GitHub 오픈소스 전략

```
README.md
├── 한국어
├── English
└── 기여 방법: 각국 음식 데이터셋 추가 가이드

CONTRIBUTING.md
├── 데이터 형식: class_name/image.jpg (224x224, JPEG)
├── label_map.json 형식
└── PR 리뷰 기준 (최소 50장/클래스, 블러 없음)

data/
├── korea/ (메인 관리)
└── {country}/ (커뮤니티 기여, 각 나라 maintainer 지정)
```

**경진대회 이후 성장 경로:**
- v1.0: 한국 음식 200 클래스 (경진대회 제출)
- v1.x: 커뮤니티 PR 리뷰 → 일본/태국/베트남 음식 추가
- v2.0: 국가별 모델 분리 or 통합 멀티국가 모델

---

## 7. 8-Week Implementation Roadmap (v2.0 확정)

**마감: 2026-05-13 18:00** | 오늘: 2026-03-25 | 남은 기간: 7주

| 주차 | 기간 | 작업 | 핵심 체크포인트 |
|---|---|---|---|
| **W1** | 03/25~03/31 | AI Hub 승인 대기 중 → Kaggle Korean + 크롤링으로 50장/클래스 확보. 전처리 파이프라인 완성. **열린데이터광장 데이터 다운로드 (OA-20918, OA-16094)** | `preprocess.py` 완성, Drive에 데이터 업로드 |
| **W2** | 04/01~04/07 | AI Hub 승인 시 데이터 병합. 미승인 시 크롤링 강화 (네이버 API). 데이터 검증 (클래스별 분포 시각화). **공공급식 식재료 → 음식-재료 매핑 테이블 구축** | 50K장 확보, 클래스 밸런스 확인, `label_ingredient_map.json` 완성 |
| **W3** | 04/08~04/14 | ViT Fine-tuning 시작. FP16 + Cosine LR. 에폭마다 체크포인트 Drive 저장 | Val Acc >75% 달성 확인 |
| **W4** | 04/15~04/21 | 하이퍼파라미터 튜닝. FAISS centroid 인덱스 구축. ONNX 변환 | 최종 모델 확정, ONNX 파일 Drive 저장 |
| **W5** | 04/22~04/28 | FastAPI 백엔드: 이미지 추론 엔드포인트 + Open Food Facts 바코드 API + **일반음식점(OA-16094) + 외국인 생활인구(OA-14993) 지도 API** 연동 | `/predict`, `/barcode`, `/restaurants`, `/hotspots` API 작동 확인 |
| **W6** | 04/29~05/05 | Claude API 연동 + SQLite 캐싱 로직. HF Spaces 배포 | 엔드투엔드 추론 파이프라인 완성 |
| **W7** | 05/06~05/11 | React PWA 개발. 카메라 이미지 업로드 + 바코드 스캔 (`@zxing/browser`) + **식당 지도 뷰** | 모바일 브라우저에서 전체 기능 동작 |
| **W8** | 05/12~**05/13** | Vercel 배포 확인. HF Spaces warm-up ping 설정. **경진대회 누리집 제출 (마감 05/13 18:00)** | **제출 완료** |

---

## 8. 리스크 매트릭스 (v2.0)

| 리스크 | 확률 | 영향 | 대응책 |
|---|---|---|---|
| AI Hub 승인 지연 | 높음 | 중간 | W1부터 크롤링 병행, 50K장 목표 유지 가능 |
| Colab 세션 끊김 (12시간) | 높음 | 낮음 | 에폭마다 Drive 체크포인트 → 재시작 후 이어서 학습 |
| Val Acc 75% 미달 | 중간 | 높음 | 클래스 수 줄이기 (200→100), 데이터 품질 재검토 |
| HF Spaces 콜드스타트 | 높음 | 중간 | Vercel Cron 5분 warm-up ping |
| Claude API 비용 초과 | 낮음 | 낮음 | 경진대회 기간 추정 비용 ~$4, 걱정 불필요 |

---

## 9. 즉시 실행 액션 아이템

```
=== 오늘 (2026-03-25) ===
[ ] 경진대회 창업 부문 참가 신청 (열린데이터광장 누리집 > 소식&참여 > 경진대회)
[ ] AI Hub (aihub.or.kr) 한국 음식 데이터셋 신청
[ ] Google Drive 폴더 구조 생성 (/allergydata/data/, /checkpoints/, /models/)
[ ] 열린데이터광장 데이터셋 다운로드
    - 서울시 공공급식 식재료 정보 (OA-20918) → label_ingredient_map.json 변환
    - 서울시 일반음식점 인허가 정보 (OA-16094) → 식당 지도용
    - 행정동 단위 단기체류 외국인 생활인구 (OA-14993) → 외국인 밀집 지역 경보용 [가점]

=== W1 (03/25~03/31) ===
[ ] Kaggle Korean Food 데이터 다운로드 + preprocess.py 작성
[ ] GitHub 레포 생성 + CONTRIBUTING.md 초안 작성
[ ] label_ingredient_map.json 구축 (OA-20918 기반)

=== W3 시작 ===
[ ] ViT 학습 코드 (HuggingFace Trainer 기반)

=== 마감 ===
[ ] 2026-05-13 18:00 경진대회 제출 완료
```
