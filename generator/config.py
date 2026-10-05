"""경로와 환경 변수. 모든 스크립트는 이 모듈을 통해 설정을 읽는다."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

LESSONS_DIR = ROOT / "data" / "lessons"
SCHEMA_PATH = ROOT / "data" / "schema" / "lesson.schema.json"
THEMES_PATH = ROOT / "data" / "themes" / "themes.json"
PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
PUBLIC_DIR = ROOT / "public"

# 레슨 형식 예시로 프롬프트에 넣는 파일 (검수 완료된 좋은 예시여야 한다)
EXAMPLE_LESSON = LESSONS_DIR / "2026-10-04.json"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
# 기본 모델이 계속 503/429이면 그 요청만 이 모델로 넘어간다 (비우면 사용 안 함)
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "")

VOICES = ["aiden", "serena"]
