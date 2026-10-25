# 구조

스위스 여행자(한국인 A1)를 위한 하루 10단어 독일어 웹앱. 콘텐츠는 Mac에서 미리 만들어 저장소에 넣고, 웹은 그 파일을 읽어 정적 사이트로 빌드한다. 서버·DB·로그인은 없다.

## 기술 스택

| 영역 | 사용 | 비고 |
|---|---|---|
| 웹 | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | 이 버전의 Next.js는 학습 데이터와 다를 수 있다. 코드 수정 전 `node_modules/next/dist/docs/` 확인 ([AGENTS.md](../AGENTS.md)) |
| 배포 | GitHub(`bmk1993yo-design/swiss-trip-deutsch`) → Vercel | `main`에 push하면 자동 배포 |
| 레슨 생성 | Python 3.12, `google-genai` (Gemini) | 무료 tier, 예비 모델로 자동 전환 |
| 검사 | `jsonschema` + 직접 만든 규칙 | [data-model.md](data-model.md) |
| 음성 | Qwen3-TTS 0.6B (`mlx-audio`), Whisper large-v3-turbo (`mlx-whisper`), ffmpeg | Apple Silicon Mac 전용 |

## 폴더

```
app/                      Next.js 라우트
  layout.tsx              공통 레이아웃, 서비스 워커 등록
  page.tsx                홈 (오늘의 레슨, 다음 레슨 카운트다운, 지난 레슨)
  lesson/[date]/page.tsx  레슨·복습 날 페이지 (빌드 시 날짜별 정적 생성)
  review/page.tsx         지난 단어 전체 복습
  manifest.ts             PWA 매니페스트
  globals.css             색상 토큰 (der 파랑 / die 빨강 / das 초록), 다크 모드
components/               화면 조각 (대부분 클라이언트 컴포넌트)
lib/
  lessons.ts              data/lessons/*.json 읽기 (빌드 시, 서버 전용)
  unlock.ts               현재 시각, ?now= 시험, 잠금 판정, 남은 시간
  storage.ts              localStorage 저장 (표시 설정, 완료한 레슨)
  format.ts               날짜 표시, Forvo 링크
  voices.ts               목소리 목록 (aiden=남성, serena=여성)
types/lesson.ts           레슨 타입 (스키마와 같은 구조 유지)
data/
  lessons/                레슨 JSON, 날짜별 1개
  schema/lesson.schema.json  레슨 형식 (검사 기준)
  themes/themes.json      Day별 테마·문법 계획
public/
  audio/<날짜>/           음성 .opus
  sw.js                   오프라인 캐시 서비스 워커
  icons/                  앱 아이콘
generator/                Python 생성·검사 스크립트 (웹 빌드와 무관)
  config.py               경로, 환경 변수
  generate_lessons.py     레슨 생성 (Gemini)
  validate_lessons.py     전체 레슨 검사
  generate_audio.py       음성 생성 + Whisper 검사
  listen_report.py        직접 들어 볼 음성 체크리스트
  providers/              LLM 공급자 (현재 Gemini만)
  tts/                    Qwen3-TTS 호출, ffmpeg 변환
  validators/             스키마·독일어 규칙·중복 검사
  prompts/                Gemini 프롬프트
  experiments/            TTS 설정을 정할 때 쓴 실험 스크립트
  tmp/                    보고서·중간 파일 (git 제외)
```

## 데이터 흐름

1. **계획**: `data/themes/themes.json`에 Day별 테마, 상황, 스위스 표현, 문법이 있다. 날짜는 `startDate + (day - 1)`로 계산한다.
2. **생성**: `generate_lessons.py`가 테마와 이미 쓴 단어 목록을 프롬프트에 넣어 Gemini에 요청한다. 날짜·잠금 시각·음성 경로는 스크립트가 채우고 `approved: false`로 저장한다.
3. **검사·검수**: `validate_lessons.py`로 형식과 규칙을 검사하고, 사람이 내용을 읽은 뒤 `approved: true`로 바꾼다.
4. **음성**: `generate_audio.py`가 단어·문장마다 목소리 2개 × (일반, 느리게) opus를 만든다.
5. **빌드**: `lib/lessons.ts`가 빌드할 때 JSON을 읽는다. 배포 환경에서는 승인된 레슨만 포함된다.
6. **공개**: 페이지는 모두 미리 빌드되어 있고, 브라우저가 현재 시각과 `unlockAt`(그날 17:00 KST)을 비교해 내용을 보여 주거나 카운트다운을 띄운다.

## 설계상 알아 둘 점

- **잠금은 화면에서만 한다.** 레슨 내용은 빌드된 HTML/JS에 이미 들어 있다. 미리 보는 것을 막는 장치가 아니라 하루 하나씩 학습하게 하는 장치다. 홈 목록에는 요약(`LessonSummary`)만 내려보내 다른 레슨 내용이 섞이지 않게 했다.
- **학습 기록은 브라우저에만 있다.** 기기를 바꾸거나 사이트 데이터를 지우면 사라진다.
- **콘텐츠를 바꾸면 다시 배포해야 한다.** JSON·음성은 빌드 시점에 들어가므로 push 없이는 반영되지 않는다.
- **`generator/`는 웹과 분리되어 있다.** `tsconfig.json`에서 제외되며 Vercel 빌드에 쓰이지 않는다.
