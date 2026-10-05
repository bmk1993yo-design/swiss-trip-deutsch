def headword_key(german: str) -> str:
    """관사를 떼고 소문자로: 'der Koffer' → 'koffer'"""
    parts = german.split(" ", 1)
    if len(parts) == 2 and parts[0] in ("der", "die", "das"):
        german = parts[1]
    return german.strip().lower()


def check_duplicates(lessons: list[dict]) -> list[str]:
    """여러 레슨 사이에 겹치는 표제어·문장."""
    errors: list[str] = []
    seen_words: dict[str, str] = {}
    seen_sentences: dict[str, str] = {}
    for lesson in lessons:
        if lesson.get("type") != "lesson":
            continue
        for w in lesson["words"]:
            key = headword_key(w["german"])
            if key in seen_words:
                errors.append(f"[중복] '{w['german']}' — {seen_words[key]}, {lesson['date']}")
            else:
                seen_words[key] = lesson["date"]
        for s in lesson["sentences"]:
            key = s["german"].strip().lower()
            if key in seen_sentences:
                errors.append(f"[중복 문장] '{s['german']}' — {seen_sentences[key]}, {lesson['date']}")
            else:
                seen_sentences[key] = lesson["date"]
    return errors
