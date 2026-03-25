"""
app/core/model.py — ONNX 모델 + FAISS 인덱스 싱글턴 로더
W4에서 생성된 model_int8.onnx, faiss_index.bin, label_ingredient_map.json 사용
"""
import hashlib
import io
import json
import os
from functools import lru_cache
from typing import Optional

import numpy as np
from PIL import Image

MODEL_PATH  = os.getenv("MODEL_PATH",  "models/model_int8.onnx")
FAISS_PATH  = os.getenv("FAISS_PATH",  "models/faiss_index.bin")
MAP_PATH    = os.getenv("MAP_PATH",    "data/label_ingredient_map.json")
LABELS_PATH = os.getenv("LABELS_PATH", "models/labels.json")

IMG_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


class ModelNotReadyError(RuntimeError):
    pass


class AllergyModel:
    def __init__(self):
        self._session = None
        self._index   = None
        self._labels: list[str] = []
        self._ing_map: dict     = {}
        self._ready = False

    def load(self):
        """서버 시작 시 1회 호출. 파일 없으면 NotReady 상태 유지."""
        import onnxruntime as ort
        import faiss

        missing = [p for p in (MODEL_PATH, FAISS_PATH, MAP_PATH, LABELS_PATH)
                   if not os.path.exists(p)]
        if missing:
            print(f"[model] 모델 파일 없음 (W4 완료 후 사용 가능): {missing}")
            return

        self._session = ort.InferenceSession(
            MODEL_PATH,
            providers=["CPUExecutionProvider"],
        )
        self._index = faiss.read_index(FAISS_PATH)

        with open(LABELS_PATH, encoding="utf-8") as f:
            self._labels = json.load(f)          # ["김치찌개", "불고기", ...]

        with open(MAP_PATH, encoding="utf-8") as f:
            self._ing_map = json.load(f)

        self._ready = True
        print(f"[model] 로드 완료 — {len(self._labels)}개 클래스")

    def _preprocess(self, img_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE), Image.BICUBIC)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
        return arr.transpose(2, 0, 1)[np.newaxis]   # (1, 3, 224, 224)

    def predict(self, img_bytes: bytes, top_k: int = 3) -> dict:
        if not self._ready:
            raise ModelNotReadyError("모델 파일 없음 (W4 완료 후 사용 가능)")

        pixel_values = self._preprocess(img_bytes)
        input_name   = self._session.get_inputs()[0].name

        # ViT hidden_state → (1, 768) CLS 토큰
        outputs = self._session.run(None, {input_name: pixel_values})
        embedding = outputs[0][:, 0, :]     # CLS token, shape (1, 768)
        embedding = embedding / (np.linalg.norm(embedding, axis=1, keepdims=True) + 1e-8)

        distances, indices = self._index.search(embedding.astype(np.float32), top_k)

        top3 = []
        for dist, idx in zip(distances[0], indices[0]):
            label = self._labels[idx]
            score = float(1 / (1 + dist))   # L2 거리 → 유사도
            top3.append({"label": label, "score": round(score, 4)})

        best = top3[0]["label"]
        info = self._ing_map.get(best, {"ingredients": [], "allergens": []})

        return {
            "food_name":   best,
            "top3":        top3,
            "ingredients": info["ingredients"],
            "allergens":   info["allergens"],
        }


_model = AllergyModel()


def get_model() -> AllergyModel:
    return _model


def startup_load():
    _model.load()
