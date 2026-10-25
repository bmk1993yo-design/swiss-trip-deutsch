# 음성 생성 (TTS)

Apple Silicon Mac에서만 동작한다 (`mlx` 사용). ffmpeg가 필요하다 (`brew install ffmpeg`).

## 무엇을 만드나

레슨마다 (단어 10 + 문장 3) × 목소리 2 × (일반, 느리게) = **52개** `.opus` 파일.

| 목소리 | 화면 표시 |
|---|---|
| `aiden` | 남성 |
| `serena` | 여성 |

## 명령

```bash
source .venv/bin/activate

python generator/generate_audio.py                     # 전체 레슨 중 없는 음성만
python generator/generate_audio.py 2026-10-14          # 특정 날짜만
python generator/generate_audio.py 2026-10-14 --force  # 그날 전부 다시
python generator/generate_audio.py 2026-10-14 --item word-03 --voice serena --seeds 3,4,5
```

- `--item`을 주면 자동으로 `--force`.
- `--seeds`: 같은 seed는 항상 같은 음성. 기본 `0,1,2`. 다시 만들 때는 안 쓴 숫자를 쓴다.
- 복습 날(`type: review`)은 건너뛴다.

## 처리 과정

1. **생성**: Qwen3-TTS 0.6B CustomVoice 8bit (`generator/tts/qwen_tts.py`)
   - 독일어, "또박또박 천천히" 말투 지시
   - `temperature 0.1`, `repetition_penalty 1.2`, seed 고정
   - 최대 길이: 단어 5초, 문장 12초. 거의 꽉 차면 폭주(runaway)로 보고 점수 0
2. **검사**: Whisper large-v3-turbo로 받아 적어 원문과 유사도 비교 (소문자, `ß→ss`, 문자만 남김)
   - 0.8 이상이면 통과, 아니면 다음 seed. 모두 실패하면 가장 점수 높은 것을 저장
3. **후처리**: 최대 음량 -1 dBFS, 앞뒤 0.15초 무음
4. **변환**: opus 32kbps 모노. 느린 버전은 `atempo=0.75` (음높이 유지)

설정을 정한 실험은 `generator/experiments/tts_stress_test.py`에 있다 (결과는 `generator/tmp/tts_stress/`).

## 결과물

| 파일 | 내용 |
|---|---|
| `public/audio/<날짜>/*.opus` | 배포되는 음성 (git에 포함) |
| `generator/tmp/audio_report.json` | 전체 생성 기록: 들은 글, 유사도, seed. 다시 만든 항목만 갱신 |
| `generator/tmp/listen_report.md` | 직접 들어 볼 목록 (체크리스트) |
| `generator/tmp/listened.json` | 들어 보고 확인한 항목 |
| `generator/tmp/audio_work/` | 중간 wav (지워도 됨) |

## 직접 들어 보기

`listen_report.md`에 나오는 대상:

- **스위스 표현**: Whisper가 표준 독일어로 바꿔 적기 쉬워 점수와 상관없이 항상 확인
- **받아 적기 불일치**: 유사도 0.8 미만

각 항목에 레슨 링크, 카드 위치(`단어 4/10`), 다시 만들기 명령이 있다. 괜찮으면 `- [ ]`를 `- [x]`로 바꿔 저장하고 `python generator/listen_report.py`로 갱신하면 목록에서 빠진다. 그 음성을 다시 만들면 확인 기록이 지워져 다시 나온다.

Whisper 점수는 참고용이다. 점수가 높아도 강세가 틀릴 수 있고, 짧은 단어나 스위스 표현은 맞게 읽어도 점수가 낮을 수 있다. 최종 판단은 귀로 한다.

## 음성 교체 후 확인

1. 브라우저 **⌘ + Shift + R** (강력 새로고침)
2. `git add public/audio && git commit -m "Day N word-03 음성 교체" && git push`
3. 휴대폰 홈 화면 앱은 예전 음성을 계속 쓸 수 있다. [operations.md](operations.md#알려진-이슈)의 서비스 워커 캐시 항목 참고.

seed를 여러 번 바꿔도 같은 발음이 계속 틀리면 모델 한계일 가능성이 크다. 그 단어를 다른 단어로 바꾸거나, 다른 TTS로 그 파일만 만드는 등 따로 대응한다.
