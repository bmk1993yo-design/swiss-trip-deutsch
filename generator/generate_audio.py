"""레슨 음성 생성 (Mac, Apple Silicon).

    python generator/generate_audio.py                  # 모든 레슨, 아직 없는 음성만
    python generator/generate_audio.py 2026-10-07       # 특정 날짜만
    python generator/generate_audio.py --force          # 이미 있어도 다시 생성
    python generator/generate_audio.py 2026-10-07 --item word-08 --voice serena --seeds 3,4,5
                                                        # 한 항목만 다른 seed로 다시 생성

단어·문장마다 목소리(aiden, serena)별로 일반/느린 opus 2개씩 만든다.
1. Qwen3-TTS로 생성 (최대 길이 제한)
2. Whisper로 받아 적어 원문과 비교 → 다르면 seed를 바꿔 최대 3번
3. 앞뒤 무음 + 음량 맞춤 → opus 변환 (느린 버전은 0.75배속)
결과 보고서: generator/tmp/audio_report.json  (직접 들어 볼 목록 포함)
"""
import argparse
import difflib
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import LESSONS_DIR, PUBLIC_DIR, ROOT, VOICES
from tts.ffmpeg_convert import SLOW_TEMPO, finish, to_opus, write_wav
from tts.qwen_tts import QwenTTS
from utils import read_json, write_json

WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"
WORK_DIR = ROOT / "generator" / "tmp" / "audio_work"
REPORT = ROOT / "generator" / "tmp" / "audio_report.json"
SEEDS = [0, 1, 2]
PASS_SCORE = 0.8  # 받아 적은 글과 원문의 유사도 (0~1)
MAX_SECONDS = {"word": 5.0, "sentence": 12.0}


def normalize(text: str) -> str:
    text = text.lower().replace("ß", "ss")
    return " ".join(re.findall(r"[a-zäöü]+", text))


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def transcribe(wav: Path) -> str:
    import mlx_whisper

    result = mlx_whisper.transcribe(str(wav), path_or_hf_repo=WHISPER_MODEL, language="de", temperature=0.0)
    return result["text"].strip()


def items_of(lesson: dict):
    swiss_ids = {w["id"] for w in lesson["words"] if w["isSwissExpression"]}
    swiss_words = {w["german"].split(" ")[-1].lower() for w in lesson["words"] if w["isSwissExpression"]}
    for w in lesson["words"]:
        yield "word", w, w["id"] in swiss_ids
    for s in lesson["sentences"]:
        has_swiss = bool(set(s.get("usesWords", [])) & swiss_ids) or any(
            sw in s["german"].lower() for sw in swiss_words
        )
        yield "sentence", s, has_swiss


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dates", nargs="*", help="YYYY-MM-DD (생략하면 전체)")
    ap.add_argument("--force", action="store_true", help="이미 있는 음성도 다시 생성")
    ap.add_argument("--item", help="이 id만 (예: word-08). 지정하면 --force로 간주")
    ap.add_argument("--voice", choices=VOICES, help="이 목소리만")
    ap.add_argument("--seeds", help="시도할 seed 목록 (기본 0,1,2)")
    args = ap.parse_args()
    seeds = [int(x) for x in args.seeds.split(",")] if args.seeds else SEEDS
    force = args.force or bool(args.item)

    paths = sorted(LESSONS_DIR.glob("????-??-??.json"))
    if args.dates:
        paths = [p for p in paths if p.stem in args.dates]

    jobs = []
    for path in paths:
        lesson = read_json(path)
        for kind, item, swiss in items_of(lesson):
            if args.item and item["id"] != args.item:
                continue
            for voice in VOICES:
                if args.voice and voice != args.voice:
                    continue
                normal = PUBLIC_DIR / item["audio"][voice]["normal"].lstrip("/")
                slow = PUBLIC_DIR / item["audio"][voice]["slow"].lstrip("/")
                if force or not (normal.exists() and slow.exists()):
                    jobs.append((lesson["date"], kind, item, swiss, voice, normal, slow))

    if not jobs:
        print("만들 음성이 없습니다. (--force로 다시 생성)")
        return

    print(f"음성 {len(jobs)}건 생성 (파일 {len(jobs) * 2}개). 모델 로드 중…")
    tts = QwenTTS()
    sr = tts.sample_rate
    report = {"generated": [], "listen": []}
    started = time.time()

    for n, (date, kind, item, swiss, voice, normal, slow) in enumerate(jobs, 1):
        text = item["german"]
        best = None  # (score, audio, heard, seed)
        for seed in seeds:
            audio = tts.synth(text, voice, MAX_SECONDS[kind], seed=seed)
            seconds = len(audio) / sr
            runaway = seconds >= MAX_SECONDS[kind] - 0.3
            wav = WORK_DIR / date / f"{item['id']}-{voice}-raw.wav"
            write_wav(wav, audio, sr)
            heard = transcribe(wav)
            score = 0.0 if runaway else similarity(text, heard)
            if best is None or score > best[0]:
                best = (score, audio, heard, seed)
            if score >= PASS_SCORE:
                break

        score, audio, heard, seed = best
        final_wav = WORK_DIR / date / f"{item['id']}-{voice}.wav"
        write_wav(final_wav, finish(audio, sr), sr)
        to_opus(final_wav, normal)
        to_opus(final_wav, slow, tempo=SLOW_TEMPO)

        entry = {
            "date": date,
            "id": item["id"],
            "voice": voice,
            "text": text,
            "heard": heard,
            "score": round(score, 2),
            "seed": seed,
            "file": str(normal.relative_to(ROOT)),
        }
        report["generated"].append(entry)

        reasons = []
        if score < PASS_SCORE:
            reasons.append(f"받아 적기 불일치 ({score:.2f})")
        if swiss:
            reasons.append("스위스 표현")
        if reasons:
            report["listen"].append(entry | {"reason": ", ".join(reasons)})

        mark = "✓" if score >= PASS_SCORE else "△"
        flag = f"  ← 들어 보기: {', '.join(reasons)}" if reasons else ""
        print(f"[{n:3d}/{len(jobs)}] {mark} {date} {item['id']:12s} {voice:6s} {score:.2f}  {text!r} → {heard!r}{flag}")

    if REPORT.exists() and (args.dates or args.item or args.voice):
        # 일부만 다시 만든 경우: 기존 보고서에서 같은 항목을 교체
        old = read_json(REPORT)
        done = {(e["date"], e["id"], e["voice"]) for e in report["generated"]}
        for key in ("generated", "listen"):
            report[key] = [e for e in old[key] if (e["date"], e["id"], e["voice"]) not in done] + report[key]
    write_json(REPORT, report)
    minutes = (time.time() - started) / 60
    print(f"\n완료 {len(jobs)}건 · {minutes:.1f}분 · 직접 들어 볼 것 {len(report['listen'])}건")
    print(f"보고서: {REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
