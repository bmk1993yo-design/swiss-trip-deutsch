# 🇨🇭 Swiss Trip Deutsch

스위스 여행을 위한 하루 10단어 독일어. 매일 17:00 KST에 새 레슨이 공개된다.

- 레슨 내용: Gemini API로 생성 → 자동 검사 → 사람이 검수
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

## 폴더

| 경로 | 내용 |
|---|---|
| `app/`, `components/`, `lib/` | 웹앱 |
| `data/lessons/` | 레슨 JSON (날짜별 1개) |
| `data/schema/lesson.schema.json` | 레슨 형식 (검사 기준) |
| `data/themes/themes.json` | 30일 테마·문법 계획 |
| `public/audio/<날짜>/` | 음성 (`word-01-aiden.opus`, `…-slow.opus`) |
| `generator/` | 생성·검사 스크립트 |
| `generator/prompts/` | Gemini 생성 프롬프트 |
| `generator/tmp/` | 작업 파일·보고서 (git 제외) |
