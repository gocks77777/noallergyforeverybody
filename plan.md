# Project: Allergy Scan (AAS)
**Concept:** 한국 음식 특화 AI 알레르기 안전 가이드 (서울시 데이터 경진대회 창업 부문 출품작)
**Last Updated:** 2026-03-30 (v3.0 - 진행상황 반영 + 로드맵 재배정)

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
- **Database:** SQLite (캐시)
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

## 7. 8-Week Implementation Roadmap (v3.0 - 2026-03-30 업데이트)

**마감: 2026-05-13 18:00** | 업데이트: 2026-03-30 | 남은 기간: 44일 (6주+)

| 주차 | 기간 | 작업 | 상태 |
|---|---|---|---|
| **W1** | 03/25~03/31 | 데이터 수집, 전처리, 열린데이터광장 다운로드, GitHub 레포, label_ingredient_map 구축 | **완료** |
| **W2** | 04/01~04/07 | ~~AI Hub 병합~~ → 모델 학습 완료됨. **이번 주 실제 할 일:** 모델 로컬 배치, CSV 연결, 프론트↔백 연동 테스트, i18n | 진행 예정 |
| **W3** | 04/08~04/14 | ~~ViT 학습~~ → 이미 완료. **실제:** 바코드 카메라 스캔, TTS/STT 통역 기능, UX 개선 | 재배정 |
| **W4** | 04/15~04/21 | ~~ONNX 변환~~ → 이미 완료. **실제:** 모델 정확도 검증, 필요시 재학습, 프론트 다국어 완성 | 재배정 |
| **W5** | 04/22~04/28 | HF Spaces 배포 (Dockerfile), 백엔드 통합 테스트, 엔드투엔드 파이프라인 확인 | 예정 |
| **W6** | 04/29~05/05 | Vercel 프론트 배포, Claude API 실 테스트, 모바일 브라우저 QA | 예정 |
| **W7** | 05/06~05/11 | 최종 버그 수정, 성능 최적화, 경진대회 제출 서류 준비 | 예정 |
| **W8** | 05/12~**05/13** | **경진대회 누리집 제출 (마감 05/13 18:00)** | 예정 |

> **참고:** W1~W4 원래 계획보다 2~3주 앞서 진행됨. 학습/전처리가 조기 완료되어 W2~W4는 UX 개선 및 배포 준비로 재배정.

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

## 9. 추가 기능: 다국어 TTS + STT 양방향 통역 (W7 구현)

### 개요
외국인 사용자가 자기 언어로 알레르기 질문을 선택하면, 앱이 한국어 TTS로 식당 직원에게 재생. 직원이 한국어로 음성 답변하면 STT로 인식 후 외국인의 언어로 번역해주는 양방향 통역 기능.

### 흐름
```
[외국인] 자기 언어(예: 영어)로 질문 선택 or 직접 입력
  → DeepL API: 외국인 언어 → 한국어로 번역
  → Web Speech API (TTS): 한국어 음성으로 재생 (식당 직원에게 들려줌)
        ↓
[한국인 직원] 한국어로 음성 답변
  → Web Speech API (STT): 한국어 음성 → 텍스트
  → DeepL API: 한국어 → 외국인 언어로 번역
  → 화면에 외국인 언어로 번역 결과 표시 + TTS 재생
```

### 예시
- 외국인이 영어로 선택: *"Does this dish contain peanuts?"*
- 앱이 한국어 TTS 재생: "이 음식에 땅콩 들어있나요?"
- 직원이 한국어로 대답: "아니요, 하지만 참깨가 들어있어요."
- 앱이 영어로 표시 + TTS: *"No, but it contains sesame."*

### 자주 쓰는 질문 프리셋 (외국인 언어로 버튼 제공)
- "Does this contain ○○?" / "この料理に○○は入っていますか？"
- "I have an allergy" / "アレルギーがあります"
- "Please make it without this ingredient"
- "Can I see the ingredient list?"

### 구현 스펙

| 역할 | 기술 | 비용 |
|------|------|------|
| STT (음성→텍스트) | **Web Speech API** (브라우저 내장) | 무료 |
| 번역 | **DeepL 무료 API** (월 50만자) | 무료 |
| TTS (텍스트→음성) | **Web Speech API** (브라우저 내장) | 무료 |
| 문장 생성 (알레르기 특화) | **Claude API** (기존 연동) | 미미 |

- **지원 언어:** 영어, 일본어, 중국어(간체), 스페인어, 프랑스어, 아랍어, 베트남어, 태국어
- **UI:** 언어 선택 드롭다운 → 사이트 전체 i18n 적용 (`react-i18next`)
- DeepL 무료 티어 월 50만자 → 이 앱 규모에서 절대 초과 없음

### Claude 프롬프트 (알레르기 특화 질문 생성)
```python
def build_tts_question(food_name: str, user_allergy: str, language: str) -> str:
    return f"""
음식: {food_name}, 사용자 알레르기: {user_allergy}
위 정보를 바탕으로 식당 직원에게 물어볼 짧은 한국어 질문 1문장을 만들어주세요.
그리고 같은 문장을 {language}로도 번역해주세요.
예: 한국어: "이 음식에 땅콩 들어있나요?" / English: "Does this contain peanuts?"
"""
```

---

## 10. 진행 상황 (2026-03-30 23:00 기준)

### 전체 진행률: ~75-80%

| 영역 | 진행률 | 상태 |
|---|---|---|
| 데이터 파이프라인 (W1-W2) | **100%** | 150클래스 134,476장 전처리 완료, CSV 3건 로컬 배치 완료 |
| 모델 학습 (W3-W4) | **100%** | Colab 학습 완료, ONNX 로컬 배치, 추론 10/10 정확도 검증 |
| 백엔드 API (W5) | **90%** | 4개 엔드포인트 동작 확인, 바코드 3단 fallback, CSV 실데이터 연동 |
| Claude API 연동 (W6) | **50%** | 코드 완성, 바코드 Claude 추론 추가, API 키만 넣으면 즉시 가동 |
| 프론트엔드 (W7) | **85%** | 5페이지 + 10개 언어 i18n + TTS/STT 통역 + 바코드 카메라 + 지도 |
| 배포 (W8) | **10%** | GitHub 푸시 완료, Vercel/HF Spaces 미배포 |

### 완료된 작업

```
=== 데이터 — 완료 ===
[x] AI Hub 한국 음식 데이터셋 승인 + 다운로드
[x] 열린데이터광장 CSV 3건 다운로드 + backend/data/ 배치
[x] preprocess.py 실행 (150클래스, 134,476장)
[x] label_ingredient_map.json 229개 음식 구축
[x] 행정동코드→동명 매핑 432개 (dong_names.json)

=== 모델 — 완료 ===
[x] ViT fine-tuning (Colab T4, FP16, 10 epochs)
[x] ONNX FP32 변환 + 로컬 배치 (backend/models/)
[x] 추론 테스트 10/10 정확도, 알레르겐 매핑 정상
[x] NFC 유니코드 정규화, float32 캐스팅 버그 수정

=== 백엔드 — 완료 ===
[x] FastAPI 앱 (main.py + 5 라우터)
[x] POST /predict — 이미지 → ViT 추론 → 음식명 + 알레르기
[x] GET /barcode/{code} — 3단 fallback (Open Food Facts → 식품안전나라 → Claude)
[x] GET /restaurants — 서울 12만 식당, TM→WGS84 좌표 변환, 영업중 필터
[x] GET /hotspots — 424개 행정동 외국인 밀집도, 상대 threshold
[x] claude_client.py — 10개 언어, cache.py — SQLite
[x] data.py — cp949 자동 감지, Haversine, pyproj 좌표 변환
[x] 서버 시작 시 CSV 미리 로드 (첫 요청 지연 방지)

=== 프론트엔드 — 완료 ===
[x] Vite + React + TypeScript + Tailwind + PWA
[x] 언어 선택 스플래시 (10개 언어)
[x] 10개 언어 전체 UI 다국어 (i18n.ts + LangContext)
[x] 헤더 국기 버튼 → 언어 변경 모달
[x] HomePage — 카메라/업로드 + 알레르기 13종 선택 (번역된 이름)
[x] ResultPage — 음식명, 알레르기 경고, Top-3, Claude 분석
[x] BarcodePage — 카메라 스캔 (@zxing/browser) + 수동 입력 + 성공 애니메이션
[x] MapPage — Leaflet 지도 + 식당 마커/팝업 + "Search this area" + "Go to Seoul"
[x] TranslatePage — TTS/STT 양방향 통역 (프리셋 6개 + 직접 입력 + 직원 답변 STT)
[x] 네비게이션 4탭: Scan / Barcode / Translate / Map
```

### 남은 작업 (우선순위순)

```
=== 배포 (최우선) ===
[ ] HF Spaces 백엔드 배포 (Dockerfile + 모델 업로드 + 환경변수)
[ ] Vercel 프론트엔드 배포 (API URL 연결)
[ ] Vercel Cron warm-up 설정 확인

=== Claude API ===
[ ] ANTHROPIC_API_KEY 환경변수 설정 (HF Spaces Secrets)
[ ] 음식 분석 + 바코드 알레르기 추론 실 테스트

=== 최종 점검 ===
[ ] 엔드투엔드 테스트 (모바일 브라우저에서 전체 기능)
[ ] UX 개선 (로딩, 에러 처리, 반응속도)
[ ] 경진대회 제출 서류 준비 (서비스 설명서, 스크린샷)
[ ] 경진대회 누리집 제출 (마감: 05/13 18:00)
```

### 파일 위치 참조

| 산출물 | 위치 | 비고 |
|---|---|---|
| 전처리된 이미지 (150클래스) | `D:/noallergyforeveryone/data/processed/` | 134,476장 |
| ONNX 모델 | `backend/models/model_fp32.onnx` + `.data` | 335MB, 로컬 배치 완료 |
| 라벨 | `backend/models/labels.json` | 150클래스 |
| 식재료 매핑 | `backend/data/label_ingredient_map.json` | 229개 음식 |
| 행정동 매핑 | `backend/data/dong_names.json` | 432개 |
| 서울 음식점 CSV | `backend/data/seoul_restaurants.csv` | 211MB, 12만개 영업중 |
| 외국인 생활인구 CSV | `backend/data/seoul_foreign_population.csv` | 14MB, 424개 행정동 |
| 프론트엔드 빌드 | `frontend/dist/` | ~200KB JS + 16KB CSS |
