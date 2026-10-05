import json
import time

from google import genai
from google.genai import errors, types

from config import GEMINI_API_KEY, GEMINI_FALLBACK_MODEL, GEMINI_MODEL

from .base import ContentProvider


class GeminiProvider(ContentProvider):
    name = "gemini"

    def __init__(self, model: str = GEMINI_MODEL, fallback: str = GEMINI_FALLBACK_MODEL):
        if not GEMINI_API_KEY:
            raise SystemExit("GEMINI_API_KEY가 없습니다. .env 파일에 키를 넣어 주세요 (.env.example 참고).")
        self.model = model
        self.fallback = fallback
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def generate(self, system: str, user: str, schema: dict) -> dict:
        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_json_schema=schema,
            temperature=0.7,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        # 무료 tier는 혼잡(503)·분당 한도(429)가 잦다. 기다렸다가 다시 시도하고,
        # 기본 모델이 2번 연속 실패하면 그 요청은 예비 모델로 넘긴다.
        model = self.model
        for attempt in range(6):
            try:
                res = self.client.models.generate_content(model=model, contents=user, config=config)
                if model != self.model:
                    print(f"    (예비 모델 {model} 사용)")
                return json.loads(res.text)
            except errors.APIError as e:
                if e.code not in (429, 500, 503) or attempt == 5:
                    raise
                if self.fallback and model == self.model and attempt >= 1:
                    model = self.fallback
                    print(f"    Gemini {e.code} — 예비 모델 {model}로 전환")
                    continue
                wait = 20 * (attempt + 1)
                print(f"    Gemini {e.code} ({model}) — {wait}초 후 재시도")
                time.sleep(wait)
        raise RuntimeError("unreachable")


def list_models() -> list[str]:
    client = genai.Client(api_key=GEMINI_API_KEY)
    return sorted(
        m.name.removeprefix("models/")
        for m in client.models.list()
        if "generateContent" in (m.supported_actions or [])
    )
