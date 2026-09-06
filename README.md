# NoAllergy (Allergy Scan) — 음식 사진으로 알레르기 성분 판정

한국 음식 사진이나 바코드를 찍으면 알레르기 위험 성분을 알려주는 웹앱입니다.
서울시 열린데이터광장 데이터 활용 경진대회(창업 부문, 2026.05) 출품작. 설계부터 배포까지 혼자 만들었습니다.

## 문제

외국인 관광객은 한국 음식의 성분을 알 방법이 거의 없습니다. 메뉴판에 알레르겐 표기가 없고, 라벨은 한국어뿐이고, 직원에게 물어보기도 어렵습니다.
사진 한 장으로 답을 주려면 두 가지를 동시에 풀어야 했습니다. 오답을 내면 안 되고, GPU 서버를 쓸 돈이 없습니다.

## 판단

| 문제 | 선택 | 버린 대안 |
|---|---|---|
| 오답 위험 | 답을 3단계로 막음: 공공데이터 성분 매핑 → 실패 시 Claude API 추론 → 결과 해시 캐시. 응답에 근거를 함께 표시 | LLM 단독 추론 (근거 없이 그럴듯한 오답) |
| GPU 비용 | ViT 파인튜닝 모델을 ONNX로 변환해 CPU 추론 (HuggingFace Spaces 무료 티어) | GPU 인스턴스 (월 수십 달러) |
| 데이터 결합 | 서울시 식재료 정보 × 일반음식점 인허가 × 단기체류 외국인 생활인구를 묶어 "외국인 밀집 지역별 위험 음식" 제공 | 단일 데이터셋 |

## 결과

- ViT-base 150 클래스(134K 이미지) 파인튜닝, ONNX Runtime CPU 추론
- 음식 229종 → 성분 매핑, 서울시 식당 119K건 좌표 변환(TM → WGS84), 행정동 424개 외국인 인구
- 10개 언어 UI, 바코드(Open Food Facts → 식약처 API → Claude 폴백), 음성 통역(STT/TTS)
- 경진대회 기간 누적 인프라 비용 $4

## 현재 상태

프론트는 Vercel에 배포되어 있으나, 백엔드의 Claude API 키를 비용 문제로 빼둔 상태라 사진 분석 결과 단계는 현재 동작하지 않습니다. 로컬에서 키를 넣으면 전체 흐름이 돕니다.

## 구조

```
backend/            FastAPI (HuggingFace Spaces, Docker)
  app/api/          predict · barcode · restaurants · hotspots
  app/core/         model(ONNX 로드) · claude_client · cache(SQLite) · data(CSV 파싱)
  data/             label_ingredient_map.json, dong_names.json
frontend/           React 18 + Vite + Tailwind PWA
  src/pages/        Splash · Home · Result · Barcode · Map · Translate
  src/lib/          api · i18n(10개 언어) · speech · translate
notebooks/          train.ipynb (Colab T4, FP16, 10 epoch ≈ 26분)
scripts/            데이터셋 검증, 성분 매핑 확장
```

## 실행

```bash
# backend
cd backend && pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # 없으면 성분 매핑 단계까지만 동작
uvicorn app.main:app --port 7860    # /health 로 모델 로드 확인

# frontend
cd frontend && npm install && npm run dev
```

## API

| 경로 | 역할 |
|---|---|
| `POST /predict` | 사진 → 음식 분류 → 성분 → 알레르기 분석 |
| `GET /barcode/{code}` | 바코드 → 가공식품 성분 (3단계 폴백) |
| `GET /restaurants` | 좌표 기준 주변 식당 |
| `GET /hotspots` | 외국인 밀집 지역 × 위험 음식 |
| `GET /health` | 모델 준비 상태 |
