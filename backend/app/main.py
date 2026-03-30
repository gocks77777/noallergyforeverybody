from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import predict, barcode, restaurants, hotspots
from app.core.model import startup_load


@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_load()      # ONNX + label_map 로드 (파일 없으면 스킵)
    yield


app = FastAPI(
    title="Allergy Scan API",
    description="한국 음식 알레르기 분석 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router,     prefix="/predict",     tags=["predict"])
app.include_router(barcode.router,     prefix="/barcode",     tags=["barcode"])
app.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
app.include_router(hotspots.router,    prefix="/hotspots",    tags=["hotspots"])


@app.get("/health")
def health():
    from app.core.model import get_model
    return {"status": "ok", "model_ready": get_model()._ready}
