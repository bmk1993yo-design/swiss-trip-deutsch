"""레슨 검증. 각 검사 함수는 문제 메시지 목록(list[str])을 돌려준다. 빈 목록이면 통과."""
from .duplicate_check import check_duplicates
from .german_check import check_german
from .schema_check import check_schema


def check_lesson(lesson: dict, expected: dict | None = None) -> list[str]:
    """한 레슨에 대한 스키마 + 내용 검사. expected에는 date/day/theme 등 기대값."""
    errors = check_schema(lesson)
    if errors:
        return errors  # 형식이 깨졌으면 내용 검사는 의미가 없다
    if lesson["type"] == "lesson":
        errors += check_german(lesson)
    if expected:
        for key, value in expected.items():
            if lesson.get(key) != value:
                errors.append(f"{key}: {lesson.get(key)!r} ≠ 기대값 {value!r}")
    return errors


__all__ = ["check_lesson", "check_schema", "check_german", "check_duplicates"]
