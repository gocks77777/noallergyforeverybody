"""
app/core/cache.py — SQLite 기반 예측 결과 캐시
동일 이미지+알레르기 조합 재요청 시 Claude API 비용 $0
"""
import hashlib
import json
import os
import sqlite3
from typing import Optional

DB_PATH = os.getenv("CACHE_DB", "cache.db")


def _conn() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS predict_cache (
            key       TEXT PRIMARY KEY,
            result    TEXT NOT NULL,
            created   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    con.commit()
    return con


def cache_key(img_bytes: bytes, allergies: str, language: str) -> str:
    raw = img_bytes + allergies.encode() + language.encode()
    return hashlib.md5(raw).hexdigest()


def get_cache(key: str) -> Optional[dict]:
    with _conn() as con:
        row = con.execute(
            "SELECT result FROM predict_cache WHERE key = ?", (key,)
        ).fetchone()
    if not row:
        return None
    try:
        return json.loads(row[0])
    except (json.JSONDecodeError, TypeError):
        return None


def set_cache(key: str, result: dict) -> None:
    with _conn() as con:
        con.execute(
            "INSERT OR REPLACE INTO predict_cache (key, result) VALUES (?, ?)",
            (key, json.dumps(result, ensure_ascii=False)),
        )
        con.commit()
