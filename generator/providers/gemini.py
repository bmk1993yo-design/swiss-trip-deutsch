import json
import time

from google import genai
from google.genai import errors, types

from config import GEMINI_API_KEY, GEMINI_MODEL

from .base import ContentProvider


class GeminiProvider(ContentProvider):
    name = "gemini"

    def __init__(self, model: str = GEMINI_MODEL):
        if not GEMINI_API_KEY:
            raise SystemExit("GEMINI_API_KEY가 없습니다. .env 파일에 키를 넣어 주세요 (.env.example 참고).")
        self.model = model
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def generate(self, system: str, user: str, schema: dict) -> dict:
        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_json_schema=schema,
            temperature=0.7,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        # 무료 tier는 분당 요청 수 제한이 있어 429가 나면 기다렸다가 다시 시도한다.
        for attempt in range(5):
            try:
                res = self.client.models.generate_content(model=self.model, contents=user, config=config)
                return json.loads(res.text)
            except errors.APIError as e:
                if e.code in (429, 500, 503) and attempt < 4:
                    wait = 20 * (attempt + 1)
                    print(f"    Gemini {e.code} — {wait}초 후 재시도")
                    time.sleep(wait)
                    continue
                raise
        raise RuntimeError("unreachable")


def list_models() -> list[str]:
    client = genai.Client(api_key=GEMINI_API_KEY)
    return sorted(
        m.name.removeprefix("models/")
        for m in client.models.list()
        if "generateContent" in (m.supported_actions or [])
    )
