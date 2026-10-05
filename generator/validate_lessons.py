"""data/lessons/ 의 모든 레슨 검사.

    python generator/validate_lessons.py            # 전체
    python generator/validate_lessons.py 2026-10-07 # 특정 날짜만

문제가 있으면 종료 코드 1. git push 전에 실행한다.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import LESSONS_DIR, THEMES_PATH
from utils import read_json
from utils.dates import lesson_date, unlock_at
from validators import check_duplicates, check_lesson


def main() -> None:
    only = set(sys.argv[1:])
    themes_doc = read_json(THEMES_PATH)
    themes = {t["day"]: t for t in themes_doc["themes"]}

    lessons, total_errors, drafts = [], 0, []
    for path in sorted(LESSONS_DIR.glob("*.json")):
        try:
            lesson = read_json(path)
        except ValueError as e:
            print(f"✗ {path.name}: JSON 파싱 실패 — {e}")
            total_errors += 1
            continue
        lessons.append(lesson)
        if only and path.stem not in only:
            continue

        day = lesson.get("day")
        expected = {"date": path.stem}
        if day in themes:
            t = themes[day]
            expected |= {
                "date": lesson_date(themes_doc["startDate"], day),
                "unlockAt": unlock_at(path.stem),
                "theme": {k: t[k] for k in ("id", "title", "emoji")},
            }
        errors = check_lesson(lesson, expected)
        if day in themes and not errors and lesson["grammar"]["id"] != themes[day]["grammarFocus"]["id"]:
            errors.append(f"[grammar] id는 '{themes[day]['grammarFocus']['id']}' 이어야 함")

        mark = "✓" if not errors else "✗"
        status = "" if lesson.get("approved") else "  (검수 전)"
        print(f"{mark} {path.name}  Day {day}{status}")
        for e in errors:
            print(f"    {e}")
        total_errors += len(errors)
        if not lesson.get("approved"):
            drafts.append(path.stem)

    dup = check_duplicates([l for l in lessons if "words" in l])
    for e in dup:
        print(f"✗ {e}")
    total_errors += len(dup)

    print(f"\n레슨 {len(lessons)}개 · 문제 {total_errors}건 · 검수 전 {len(drafts)}개")
    sys.exit(1 if total_errors else 0)


if __name__ == "__main__":
    main()
