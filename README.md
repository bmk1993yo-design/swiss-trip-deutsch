# 🇨🇭 Swiss Trip Deutsch

스위스 여행을 위한 하루 10단어 독일어. 매일 17:00 KST에 새 레슨이 공개된다.

- 레슨 내용: Gemini API로 생성 (`GEMINI_MODEL`, 혼잡하면 `GEMINI_FALLBACK_MODEL`) → 자동 검사 → 사람이 검수
- 음성: Qwen3-TTS 0.6B (Mac 로컬) · 목소리 aiden(남성), serena(여성)
- 웹: Next.js 정적 사이트 → GitHub → Vercel 자동 배포

## 처음 설정

```bash
# 웹앱
npm install

# 생성 스크립트 (Apple Silicon Mac)
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r generator/requirements.txt
brew install ffmpeg

cp .env.example .env   # GEMINI_API_KEY 입력
```

## 레슨 추가 순서

```bash
source .venv/bin/activate

# 1. 레슨 생성 (data/themes/themes.json의 Day 번호)
python generator/generate_lessons.py --days 3-10

# 2. 자동 검사
python generator/validate_lessons.py

# 3. 내용 검수 → 문제없으면 해당 JSON의 "approved"를 true로

# 4. 음성 생성 (없는 것만). 끝나면 "들어 볼 것" 목록 확인
python generator/generate_audio.py

# 5. 확인 후 배포
npm run dev                      # http://localhost:3000/?now=2026-10-07T18:00
git add . && git commit -m "Day 3-10" && git push
```

`approved: false`인 레슨은 배포된 사이트에 나오지 않는다 (개발 모드에서는 "검수 전"으로 표시).

매주 7일째(Day 7, 14, 21…)는 복습 날이다. Gemini를 쓰지 않고 그 주 레슨 6개로 자동 구성되며, 음성도 따로 만들지 않는다.

## 생성된 레슨 확인

```bash
npm run dev    # 터미널 창은 열어 둔 채로
```

- 특정 날: `http://localhost:3000/lesson/2026-10-06?now=2026-10-06T18:00`
- 전체 목록: `http://localhost:3000/?now=2026-10-13T18:00` → "지난 레슨"에서 선택
- `?now=`는 그 시각(KST)인 것처럼 보여 준다 (개발 모드에서만 동작)
- 파일로 보기: `data/lessons/YYYY-MM-DD.json`

## 직접 들어 볼 음성 (체크리스트)

`generate_audio.py`가 끝나면 **`generator/tmp/listen_report.md`** 가 만들어진다.

- 대상: 스위스 표현(항상) + Whisper 받아 적기 유사도 0.8 미만
- 날짜별로 레슨 페이지 링크, 카드 위치(예: `단어 4/10`), 목소리, 사유, Whisper가 들은 글, 다시 만들기 명령이 있다
- 들어 보고 괜찮으면 `- [ ]` → `- [x]`로 바꿔 저장 → 다음 보고서부터 빠진다
  - 바로 갱신: `python generator/listen_report.py`
  - 확인 기록: `generator/tmp/listened.json`
- 그 음성을 다시 생성하면 확인 기록이 지워져 다시 목록에 나온다
- 전체 생성 기록(유사도, seed 등): `generator/tmp/audio_report.json`

## 일부 음성만 다시 만들기

**① 바꿀 음성 찾기**

| 정보 | 예시 | 찾는 곳 |
|---|---|---|
| 날짜 | `2026-10-06` | 레슨 페이지 주소 |
| 항목 | `word-03`, `sentence-02` | 단어 카드 순서(1/10 → `word-01`), 문장 순서 |
| 목소리 | `aiden`(남성), `serena`(여성) | 카드의 "남성"/"여성" 버튼 |

**② 다시 생성**

```bash
source .venv/bin/activate

# 항목 하나, 목소리 하나
python generator/generate_audio.py 2026-10-06 --item word-03 --voice serena --seeds 3,4,5

# 항목 하나, 두 목소리 모두
python generator/generate_audio.py 2026-10-06 --item word-03 --seeds 3,4,5

# 하루치 전체
python generator/generate_audio.py 2026-10-06 --force
```

`--seeds`: 같은 seed는 항상 같은 음성을 만든다 (기본 `0,1,2`). 다시 만들 때는 안 쓴 숫자(`3,4,5` → `6,7,8` …)를 넣는다. 앞에서부터 시도해 Whisper 검사를 처음 통과한 음성이 저장된다.

**③ 확인 후 배포**

1. 브라우저에서 **⌘ + Shift + R** (강력 새로고침, 예전 음성 캐시 무시) 후 다시 듣기
2. 결과 기록: `generator/tmp/audio_report.json` (다시 만든 항목만 갱신)
3. 배포
   ```bash
   git add public/audio && git commit -m "Day 3 word-03 음성 교체" && git push
   ```

휴대폰 홈 화면 앱은 예전 음성을 캐시해 둘 수 있다. 바로 안 바뀌면 사이트 데이터를 지우거나 앱을 다시 연다. seed를 여러 번 바꿔도 같은 단어 발음이 계속 틀리면 모델의 한계일 수 있으니 따로 대응한다.

## 폴더

| 경로 | 내용 |
|---|---|
| `app/`, `components/`, `lib/` | 웹앱 |
| `data/lessons/` | 레슨 JSON (날짜별 1개) |
| `data/schema/lesson.schema.json` | 레슨 형식 (검사 기준) |
| `data/themes/themes.json` | 날짜별 테마·문법 계획 (365일 중 확정된 부분) |
| `public/audio/<날짜>/` | 음성 (`word-01-aiden.opus`, `…-slow.opus`) |
| `generator/` | 생성·검사 스크립트 |
| `generator/prompts/` | Gemini 생성 프롬프트 |
| `generator/tmp/` | 작업 파일·보고서 (git 제외) |
