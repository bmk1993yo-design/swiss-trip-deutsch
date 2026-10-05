"""레슨 JSON 생성.

    python generator/generate_lessons.py --days 2-10       # Day 2~10 중 아직 없는 날만
    python generator/generate_lessons.py --days 5 --overwrite
    python generator/generate_lessons.py --days 2 --dry-run   # 프롬프트만 출력 (API 호출 없음)
    python generator/generate_lessons.py --list-models

생성된 레슨은 항상 approved: false 로 저장된다. 검수 후 직접 true로 바꾼다.
"""
import argparse
import copy
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import EXAMPLE_LESSON, LESSONS_DIR, PROMPTS_DIR, SCHEMA_PATH, THEMES_PATH, VOICES
from utils import read_json, write_json
from utils.dates import lesson_date, unlock_at
from validators import check_lesson
from validators.duplicate_check import headword_key

MAX_ATTEMPTS = 3

# LLM이 쓰지 않고 스크립트가 채우는 필드
FIXED_TOP = ["type", "schemaVersion", "date", "day", "unlockAt", "theme", "approved"]
# Gemini 구조화 출력이 지원하지 않는 JSON Schema 키워드
UNSUPPORTED = {"pattern", "not", "allOf", "if", "then", "else", "const", "$schema", "$id", "$defs"}


# ---------------------------------------------------------------- 프롬프트

def load_prompt() -> tuple[str, str]:
    text = (PROMPTS_DIR / "lesson_prompt.md").read_text(encoding="utf-8")
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    _, rest = re.split(r"^# SYSTEM\s*$", text, maxsplit=1, flags=re.M)
    system, user = re.split(r"^# USER\s*$", rest, maxsplit=1, flags=re.M)
    return system.strip(), user.strip()


def strip_audio(lesson: dict) -> dict:
    lesson = copy.deepcopy(lesson)
    for item in lesson["words"] + lesson["sentences"]:
        item.pop("audio", None)
    return lesson


def fill(template: str, **values: str) -> str:
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    if leftover := re.findall(r"\{\{\w+\}\}", template):
        raise ValueError(f"채워지지 않은 자리표시자: {leftover}")
    return template


# ---------------------------------------------------------------- 스키마

def generation_schema() -> dict:
    """lesson.schema.json → LLM용 단순 스키마.
    $ref를 풀고, 지원하지 않는 키워드와 스크립트가 채우는 필드(audio, 날짜 등)를 뺀다.
    전체 규칙은 생성 후 원래 스키마로 다시 검사한다."""
    full = read_json(SCHEMA_PATH)
    defs = full["$defs"]

    def resolve(node):
        if isinstance(node, dict):
            if "$ref" in node:
                return resolve(defs[node["$ref"].split("/")[-1]])
            out = {}
            for k, v in node.items():
                if k == "properties":  # 필드 이름(예: grammar.pattern)은 키워드가 아니므로 유지
                    out[k] = {name: resolve(sub) for name, sub in v.items()}
                elif k not in UNSUPPORTED:
                    out[k] = resolve(v)
            return out
        if isinstance(node, list):
            return [resolve(v) for v in node]
        return node

    schema = resolve(defs["lessonDay"])
    for key in FIXED_TOP:
        schema["properties"].pop(key, None)
    schema["required"] = [k for k in schema["required"] if k not in FIXED_TOP]
    for section in ("words", "sentences"):
        item = schema["properties"][section]["items"]
        item["properties"].pop("audio")
        item["required"] = [k for k in item["required"] if k != "audio"]
    return schema


# ---------------------------------------------------------------- 후처리

def complete(raw: dict, date: str, day: int, theme: dict) -> dict:
    """LLM 출력에 고정 필드와 음성 경로를 채운다. 키 순서도 예시 파일과 맞춘다."""
    lesson = {
        "type": "lesson",
        "schemaVersion": 1,
        "date": date,
        "day": day,
        "unlockAt": unlock_at(date),
        "theme": {k: theme[k] for k in ("id", "title", "emoji")},
        "approved": False,
        "words": raw.get("words", []),
        "sentences": raw.get("sentences", []),
        "grammar": raw.get("grammar", {}),
    }
    for item in lesson["words"] + lesson["sentences"]:
        if "id" not in item:
            continue
        base = f"/audio/{date}/{item['id']}"
        item["audio"] = {v: {"normal": f"{base}-{v}.opus", "slow": f"{base}-{v}-slow.opus"} for v in VOICES}
    return lesson


def review_day(date: str, day: int, theme: dict, themes: dict, start_date: str) -> dict:
    """주간 복습 날: 같은 주의 새 레슨 날짜를 묶는다. LLM을 쓰지 않으므로 바로 승인."""
    review_of = [
        lesson_date(start_date, d)
        for d, t in sorted(themes.items())
        if t["week"] == theme["week"] and t["type"] == "lesson"
    ]
    return {
        "type": "review",
        "schemaVersion": 1,
        "date": date,
        "day": day,
        "unlockAt": unlock_at(date),
        "theme": {k: theme[k] for k in ("id", "title", "emoji")},
        "approved": True,
        "reviewOf": review_of,
    }


def content_errors(lesson: dict, theme: dict, used: set[str]) -> list[str]:
    errors = check_lesson(lesson)
    if errors:
        return errors
    if lesson["grammar"]["id"] != theme["grammarFocus"]["id"]:
        errors.append(f"[grammar] id는 '{theme['grammarFocus']['id']}' 이어야 함")
    for w in lesson["words"]:
        if headword_key(w["german"]) in used:
            errors.append(f"[중복] '{w['german']}'는 이전 레슨에서 이미 사용됨")
    return errors


# ---------------------------------------------------------------- 실행

def parse_days(spec: str) -> list[int]:
    days: list[int] = []
    for part in spec.split(","):
        a, _, b = part.partition("-")
        days += range(int(a), int(b or a) + 1)
    return days


def existing_lessons() -> list[dict]:
    return [read_json(p) for p in sorted(LESSONS_DIR.glob("????-??-??.json"))]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", help="예: 2-10, 5, 2,4,6")
    ap.add_argument("--overwrite", action="store_true", help="이미 있는 레슨도 다시 생성")
    ap.add_argument("--dry-run", action="store_true", help="API를 호출하지 않고 첫 프롬프트만 출력")
    ap.add_argument("--list-models", action="store_true", help="사용 가능한 Gemini 모델 목록")
    args = ap.parse_args()

    if args.list_models:
        from providers.gemini import list_models

        print("\n".join(list_models()))
        return
    if not args.days:
        ap.error("--days 가 필요합니다")

    themes_doc = read_json(THEMES_PATH)
    themes = {t["day"]: t for t in themes_doc["themes"]}
    system, user_tpl = load_prompt()
    example = read_json(EXAMPLE_LESSON)
    schema = generation_schema()

    if args.dry_run:
        day = parse_days(args.days)[0]
        print("=== SYSTEM ===\n" + system)
        print("\n=== USER ===\n" + fill(
            user_tpl,
            date=lesson_date(themes_doc["startDate"], day),
            day=str(day),
            theme_json=json.dumps(themes[day], ensure_ascii=False, indent=2),
            used_words="(dry-run)",
            example_lesson=json.dumps(strip_audio(example), ensure_ascii=False, indent=2),
        ))
        return

    from providers import get_provider

    provider = get_provider()
    print(f"provider: {provider.name} ({getattr(provider, 'model', '')})")
    failed: list[int] = []

    for day in parse_days(args.days):
        if day not in themes:
            print(f"Day {day}: themes.json에 없음 — 건너뜀")
            continue
        theme = themes[day]
        date = lesson_date(themes_doc["startDate"], day)
        path = LESSONS_DIR / f"{date}.json"
        if path.exists() and not args.overwrite:
            print(f"Day {day:02d} {date}: 이미 있음 — 건너뜀 (--overwrite로 다시 생성)")
            continue

        if theme["type"] == "review":
            review = review_day(date, day, theme, themes, themes_doc["startDate"])
            errors = check_lesson(review)
            if errors:
                raise SystemExit(f"복습 날 생성 오류: {errors}")
            write_json(path, review)
            print(f"Day {day:02d} {date} {theme['emoji']} {theme['title']} ✓ (복습: {len(review['reviewOf'])}개 레슨)")
            continue

        # 이번 레슨을 뺀 나머지 레슨의 표제어 (중복 방지)
        others = [l for l in existing_lessons() if l["date"] != date and l.get("type") == "lesson"]
        used = {headword_key(w["german"]) for l in others for w in l["words"]}
        prompt = fill(
            user_tpl,
            date=date,
            day=str(day),
            theme_json=json.dumps(theme, ensure_ascii=False, indent=2),
            used_words=", ".join(sorted(used)) or "(none)",
            example_lesson=json.dumps(strip_audio(example), ensure_ascii=False, indent=2),
        )

        print(f"Day {day:02d} {date} {theme['emoji']} {theme['title']}")
        errors: list[str] = []
        lesson: dict | None = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            request = prompt
            if errors:
                request += (
                    "\n\nYour previous answer had these problems. Fix all of them and return the full JSON again:\n- "
                    + "\n- ".join(errors[:20])
                )
            try:
                raw = provider.generate(system, request, schema)
            except Exception as e:  # 네트워크·파싱 오류
                errors = [f"응답 오류: {e}"]
                print(f"    {attempt}회차 실패: {e}")
                continue
            lesson = complete(raw, date, day, theme)
            errors = content_errors(lesson, theme, used)
            if not errors:
                write_json(path, lesson)
                print(f"    ✓ 저장 {path.relative_to(LESSONS_DIR.parent.parent)}")
                break
            print(f"    {attempt}회차 검사 실패 {len(errors)}건: " + "; ".join(errors[:3]))
        else:
            failed.append(day)
            # 사람이 보고 고칠 수 있도록 마지막 결과를 따로 저장
            if lesson is not None:
                draft = LESSONS_DIR.parent.parent / "generator" / "tmp" / "failed" / f"{date}.json"
                write_json(draft, lesson)
                print(f"    ✗ {MAX_ATTEMPTS}회 모두 실패 — 마지막 결과: {draft}")

    if failed:
        print(f"\n실패한 날: {failed}")
        sys.exit(1)
    print("\n완료. 다음: python generator/validate_lessons.py")


if __name__ == "__main__":
    main()
