"""Qwen3-TTS 0.6B CustomVoice (mlx-audio).

테스트로 정한 설정 (2026-10-05):
- 목소리 aiden, serena + "또박또박" 말투 지시
- temperature 0.1 (강세가 가장 일정), repetition_penalty 1.2
- seed 고정 → 다시 만들어도 같은 음성
"""
import mlx.core as mx
import numpy as np

MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-0.6B-CustomVoice-8bit"
INSTRUCT = "Speak slowly and very clearly, with precise articulation, like a language teacher."
TOKENS_PER_SECOND = 12


class QwenTTS:
    def __init__(self, model_id: str = MODEL_ID):
        from mlx_audio.tts.utils import load_model

        self.model = load_model(model_id)
        self.sample_rate: int = self.model.sample_rate

    def synth(self, text: str, speaker: str, max_seconds: float, seed: int = 0) -> np.ndarray:
        mx.random.seed(seed)
        results = self.model.generate_custom_voice(
            text=text,
            speaker=speaker,
            language="german",
            instruct=INSTRUCT,
            temperature=0.1,
            repetition_penalty=1.2,
            max_tokens=int(max_seconds * TOKENS_PER_SECOND),
        )
        return np.concatenate([np.array(r.audio) for r in results]).astype(np.float32)
