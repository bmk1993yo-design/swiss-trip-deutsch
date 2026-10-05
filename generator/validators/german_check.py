"""스키마로 표현하기 어려운 독일어·발음·구조 규칙."""
import re

from config import VOICES


def check_german(lesson: dict) -> list[str]:
    errors: list[str] = []
    word_ids = {w["id"] for w in lesson["words"]}

    for i, w in enumerate(lesson["words"], 1):
        where = f"[{w['id']} {w['german']}]"
        if w["id"] != f"word-{i:02d}":
            errors.append(f"{where} id 순서가 word-{i:02d} 이어야 함")

        if w["partOfSpeech"] == "noun":
            article = w["german"].split(" ", 1)[0]
            if article != w["gender"]:
                errors.append(f"{where} 관사 '{article}'와 gender '{w['gender']}' 불일치")
            if w["plural"] and not w["plural"].startswith("die "):
                errors.append(f"{where} 복수형은 'die …' 형태여야 함: {w['plural']}")
            if w["german"].split(" ", 1)[1][:1].islower():
                errors.append(f"{where} 명사는 대문자로 시작해야 함")

        stressed = sum(s["stress"] for s in w["pronunciation"]["korean"])
        if stressed != 1:
            errors.append(f"{where} 한국어 발음의 강세 표시가 {stressed}개 (정확히 1개여야 함)")
        if "ˈ" not in w["pronunciation"]["ipa"] and len(w["pronunciation"]["korean"]) > 1:
            errors.append(f"{where} 여러 음절 단어인데 IPA에 강세 기호 ˈ 없음")
        if w["isSwissExpression"] and not w.get("swissNote"):
            errors.append(f"{where} 스위스 표현에는 swissNote가 필요함")

    swiss = sum(w["isSwissExpression"] for w in lesson["words"])
    if not 1 <= swiss <= 2:
        errors.append(f"[words] 스위스 표현이 {swiss}개 (1~2개여야 함)")

    for i, s in enumerate(lesson["sentences"], 1):
        where = f"[{s['id']}]"
        if s["id"] != f"sentence-{i:02d}":
            errors.append(f"{where} id 순서가 sentence-{i:02d} 이어야 함")
        n_words = len(re.findall(r"[A-Za-zÄÖÜäöü]+", s["german"]))
        if n_words > 10:
            errors.append(f"{where} 문장이 {n_words}단어 (10단어 이하)")
        unknown = set(s.get("usesWords", [])) - word_ids
        if unknown:
            errors.append(f"{where} usesWords에 없는 id: {sorted(unknown)}")
        if not s.get("usesWords"):
            errors.append(f"{where} 오늘의 단어를 하나 이상 사용해야 함 (usesWords 비어 있음)")
        if len(s["pronunciation"]["korean"]) != n_words:
            errors.append(
                f"{where} 한국어 발음 덩어리 {len(s['pronunciation']['korean'])}개 ≠ 단어 수 {n_words}"
            )

    # 음성 경로 규칙: /audio/<date>/<id>-<voice>[-slow].opus
    for item in lesson["words"] + lesson["sentences"]:
        for voice in VOICES:
            base = f"/audio/{lesson['date']}/{item['id']}-{voice}"
            pair = item["audio"].get(voice, {})
            if pair.get("normal") != f"{base}.opus" or pair.get("slow") != f"{base}-slow.opus":
                errors.append(f"[{item['id']}] {voice} 음성 경로가 규칙과 다름")

    return errors
