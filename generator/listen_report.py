"""직접 들어 볼 음성만 모은 보고서: generator/tmp/listen_report.md

    python generator/listen_report.py    # 보고서 다시 만들기 (generate_audio.py가 끝날 때 자동 실행)

들어 보고 괜찮은 항목은 보고서에서 `- [ ]`를 `- [x]`로 바꿔 저장한다.
다음에 보고서를 만들 때 체크한 항목은 확인 완료(listened.json)로 기록되어 목록에서 빠진다.
그 음성을 다시 생성하면 확인 기록이 지워져 다시 목록에 나온다.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import LESSONS_DIR, ROOT
from utils import read_json, write_json

TMP = ROOT / "generator" / "tmp"
AUDIO_REPORT = TMP / "audio_report.json"
LISTEN_MD = TMP / "listen_report.md"
LISTENED = TMP / "listened.json"

VOICE_LABEL = {"aiden": "남성", "serena": "여성"}


def key_of(e: dict) -> str:
    return f"{e['date']}:{e['id']}:{e['voice']}"


def checked_in_markdown() -> set[str]:
    """기존 보고서에서 [x]로 체크한 항목의 키"""
    if not LISTEN_MD.exists():
        return set()
    text = LISTEN_MD.read_text(encoding="utf-8")
    return set(re.findall(r"^- \[[xX]\] .*?<!-- key:(\S+) -->", text, flags=re.M))


def forget(keys: set[str]) -> None:
    """다시 생성한 음성은 확인 기록을 지운다 (generate_audio.py에서 호출)."""
    if not LISTENED.exists() or not keys:
        return
    write_json(LISTENED, sorted(set(read_json(LISTENED)) - keys))


def position(lesson: dict, item_id: str) -> tuple[str, str]:
    """('단어 4/10', 'das Halbtax') — 화면에서 찾기 쉬운 위치"""
    for section, label in (("words", "단어"), ("sentences", "문장")):
        items = lesson[section]
        for i, item in enumerate(items, 1):
            if item["id"] == item_id:
                return (f"{label} {i}/{len(items)}", item["german"])
    return (item_id, "")


def build() -> int:
    listened = set(read_json(LISTENED)) if LISTENED.exists() else set()
    listened |= checked_in_markdown()
    write_json(LISTENED, sorted(listened))

    entries = read_json(AUDIO_REPORT)["listen"] if AUDIO_REPORT.exists() else []
    lessons = {p.stem: read_json(p) for p in LESSONS_DIR.glob("????-??-??.json")}

    by_date: dict[str, list[tuple[dict, str, str]]] = {}
    for e in entries:
        lesson = lessons.get(e["date"])
        if not lesson or lesson.get("type") != "lesson" or key_of(e) in listened:
            continue
        where, german = position(lesson, e["id"])
        if german != e["text"]:  # 레슨 내용이 바뀌어 기록이 맞지 않으면 건너뜀
            continue
        by_date.setdefault(e["date"], []).append((e, where, german))

    total = sum(len(v) for v in by_date.values())
    lines = [
        f"# 직접 들어 볼 음성 ({total}건)",
        "",
        "들어 보고 괜찮으면 `- [ ]`를 `- [x]`로 바꿔 저장하세요. "
        "다음 보고서부터 빠집니다 (`python generator/listen_report.py`로 바로 갱신).",
        "",
        "사유: **스위스 표현**은 Whisper가 표준 독일어로 바꿔 적기 쉬워 항상 확인 대상입니다. "
        "**받아 적기 불일치**는 원문과 들은 글의 유사도가 0.8 미만입니다.",
        "",
        "서버: `npm run dev` 실행 후 아래 링크. 다시 들을 때는 ⌘+Shift+R.",
    ]
    for date in sorted(by_date):
        lesson = lessons[date]
        t = lesson["theme"]
        lines += [
            "",
            f"## Day {lesson['day']} · {date} {t['emoji']} {t['title']}",
            "",
            f"열기: http://localhost:3000/lesson/{date}?now={date}T18:00",
            "",
        ]
        for e, where, german in sorted(by_date[date], key=lambda x: (x[0]["id"], x[0]["voice"])):
            voice = VOICE_LABEL.get(e["voice"], e["voice"])
            start = max(3, e["seed"] + 1)  # 기본 시도값 0,1,2 다음부터
            seeds = ",".join(str(s) for s in range(start, start + 3))
            lines += [
                f"- [ ] {where} · **{german}** · {voice} — {e['reason']} · "
                f"Whisper: “{e['heard']}” <!-- key:{key_of(e)} -->",
                f"  - 다시 만들기: `python generator/generate_audio.py {date} --item {e['id']} "
                f"--voice {e['voice']} --seeds {seeds}`",
            ]
    if total == 0:
        lines += ["", "확인할 음성이 없습니다. ✓"]

    LISTEN_MD.parent.mkdir(parents=True, exist_ok=True)
    LISTEN_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return total


if __name__ == "__main__":
    n = build()
    print(f"직접 들어 볼 음성 {n}건 → {LISTEN_MD.relative_to(ROOT)}")
