"""
POST /predict
이미지 → 음식명(top-3) + 알레르기 분석
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel

from app.core import cache as cache_store
from app.core import claude_client
from app.core.model import get_model, ModelNotReadyError

router = APIRouter()


class PredictResponse(BaseModel):
    food_name: str
    top3: list[dict]        # [{"label": "김치찌개", "score": 0.92}, ...]
    ingredients: list[str]
    allergens: list[str]
    claude_analysis: str
    cached: bool


@router.post("", response_model=PredictResponse)
async def predict_image(
    file: UploadFile = File(...),
    allergies: str = Query("", description="쉼표 구분 사용자 알레르기 (예: 밀,계란)"),
    language: str = Query("ko", description="응답 언어 코드"),
):
    img_bytes = await file.read()
    if len(img_bytes) == 0:
        raise HTTPException(status_code=400, detail="빈 파일")

    # 캐시 확인
    key = cache_store.cache_key(img_bytes, allergies, language)
    cached = cache_store.get_cache(key)
    if cached:
        return PredictResponse(**cached, cached=True)

    # 모델 추론
    try:
        result = get_model().predict(img_bytes)
    except ModelNotReadyError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Claude 알레르기 분석
    user_allergy_list = [a.strip() for a in allergies.split(",") if a.strip()]
    try:
        analysis = claude_client.analyze_allergens(
            food_name=result["food_name"],
            ingredients=result["ingredients"],
            allergens_in_food=result["allergens"],
            user_allergies=user_allergy_list,
            language=language,
        )
    except Exception as e:
        analysis = f"분석 실패: {e}"

    payload = {
        "food_name":       result["food_name"],
        "top3":            result["top3"],
        "ingredients":     result["ingredients"],
        "allergens":       result["allergens"],
        "claude_analysis": analysis,
    }

    # 분석 실패 시 캐시하지 않음 (다음 요청에서 재시도)
    if not analysis.startswith("분석 실패"):
        cache_store.set_cache(key, payload)
    return PredictResponse(**payload, cached=False)
