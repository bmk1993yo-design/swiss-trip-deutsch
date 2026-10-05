"""wav 후처리와 opus 변환."""
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

PAD_SECONDS = 0.15  # 재생 버튼을 눌렀을 때 첫소리가 끊겨 들리지 않도록
SLOW_TEMPO = 0.75   # 느린 버전 속도 (음높이는 유지)


def finish(audio: np.ndarray, sr: int) -> np.ndarray:
    """앞뒤 무음 + 최대 음량을 -1 dBFS로 맞춤."""
    peak = float(np.abs(audio).max()) or 1.0
    audio = audio * (10 ** (-1 / 20) / peak)
    pad = np.zeros(int(sr * PAD_SECONDS), dtype=np.float32)
    return np.concatenate([pad, audio, pad])


def write_wav(path: Path, audio: np.ndarray, sr: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, audio, sr)


def to_opus(wav: Path, out: Path, tempo: float = 1.0) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav)]
    if tempo != 1.0:
        cmd += ["-filter:a", f"atempo={tempo}"]
    cmd += ["-ac", "1", "-c:a", "libopus", "-b:a", "32k", "-application", "voip", str(out)]
    subprocess.run(cmd, check=True)
