"""강세 일관성 테스트: temperature를 낮추면 강세가 매번 같아지는지 확인.

실행:
    cd ~/Desktop/Swiss_travel_lang_edu && source .venv/bin/activate
    python generator/experiments/tts_stress_test.py

결과: generator/tmp/tts_stress/<목소리>_t<온도>_<단어>.wav
    한 파일 안에 같은 단어를 3번 생성한 결과가 0.8초 간격으로 이어져 있다.
    → 3번이 모두 같은 곳에 강세가 오는지 들어 본다.
"""
import os

import mlx.core as mx
import numpy as np
import soundfile as sf
from mlx_audio.tts.utils import load_model

OUT = os.path.join(os.path.dirname(__file__), "..", "tmp", "tts_stress")
os.makedirs(OUT, exist_ok=True)

MODEL = "mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit"
CLEAR = "Speak slowly and very clearly, with precise articulation, like a language teacher."

# 강세 위치가 분명한 단어 (대문자 = 강세)
WORDS = {
    "verspaetet": "verspätet",      # ver-SPÄ-tet
    "flughafen": "der Flughafen",   # FLUG-ha-fen
    "spezialitaet": "die Spezialität",  # spe-zia-li-TÄT
}
VOICES = {
    "aiden-clear": ("aiden", CLEAR),
    "serena-clear": ("serena", CLEAR),
}
TEMPERATURES = [0.1, 0.3]
TAKES = 3

model = load_model(MODEL)
sr = model.sample_rate
gap = np.zeros(int(sr * 0.8), dtype=np.float32)

for vname, (speaker, instruct) in VOICES.items():
    for temp in TEMPERATURES:
        for key, text in WORDS.items():
            takes = []
            for seed in range(TAKES):
                mx.random.seed(seed)
                results = list(
                    model.generate_custom_voice(
                        text=text,
                        speaker=speaker,
                        language="german",
                        instruct=instruct,
                        temperature=temp,
                        repetition_penalty=1.2,
                        max_tokens=60,
                    )
                )
                takes.append(np.concatenate([np.array(r.audio) for r in results]).astype(np.float32))
            joined = np.concatenate([x for t in takes for x in (t, gap)])
            name = f"{vname}_t{temp}_{key}"
            sf.write(f"{OUT}/{name}.wav", joined, sr)
            print(f"{name:35s} 3회 길이 " + " / ".join(f"{len(t) / sr:.1f}s" for t in takes))

print(f"\n완료 → open {OUT}")
