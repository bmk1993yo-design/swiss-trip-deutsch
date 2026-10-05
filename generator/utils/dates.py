from datetime import date, timedelta


def lesson_date(start_date: str, day: int) -> str:
    """코스 시작일 + (day - 1)일 → 'YYYY-MM-DD'"""
    return (date.fromisoformat(start_date) + timedelta(days=day - 1)).isoformat()


def unlock_at(lesson_date_str: str) -> str:
    return f"{lesson_date_str}T17:00:00+09:00"
