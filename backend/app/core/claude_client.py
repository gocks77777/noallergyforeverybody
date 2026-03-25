"""
app/core/claude_client.py — Claude 3.5 Sonnet 알레르기 분석 래퍼
다국어 응답 지원 (language 파라미터)
"""
import os
from functools import lru_cache

import anthropic

CLAUDE_MODEL = "claude-sonnet-4-6"

LANG_MAP = {
    "ko": "Korean",
    "en": "English",
    "ja": "Japanese",
    "zh": "Chinese",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "vi": "Vietnamese",
    "th": "Thai",
    "ar": "Arabic",
}

SYSTEM_PROMPT = """You are an expert food allergen analyst specializing in Korean cuisine.
Given a dish name, its ingredients, and a user's declared allergies,
analyze whether the dish is safe to eat and explain why.
Be concise (2-3 sentences). Always respond in the language specified."""


def analyze_allergens(
    food_name: str,
    ingredients: list[str],
    allergens_in_food: list[str],
    user_allergies: list[str],
    language: str = "ko",
) -> str:
    lang_name = LANG_MAP.get(language, "English")

    dangerous = [a for a in user_allergies if a in allergens_in_food]

    user_msg = (
        f"Dish: {food_name}\n"
        f"Ingredients: {', '.join(ingredients)}\n"
        f"Allergens in dish: {', '.join(allergens_in_food) or 'none'}\n"
        f"User's allergies: {', '.join(user_allergies) or 'none'}\n"
        f"Dangerous allergens for this user: {', '.join(dangerous) or 'none'}\n"
        f"Respond in {lang_name}."
    )

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    return message.content[0].text
