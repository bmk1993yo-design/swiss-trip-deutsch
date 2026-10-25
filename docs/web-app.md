# 웹앱

Next.js 16 App Router 정적 사이트. 이 Next.js 버전은 예전 API와 다를 수 있으니 코드를 고치기 전에 `node_modules/next/dist/docs/`를 확인한다.

```bash
npm run dev        # http://localhost:3000
npm run build      # 배포와 같은 빌드 (승인된 레슨만)
npm run typecheck  # 타입 검사
```

## 페이지

| 경로 | 파일 | 내용 |
|---|---|---|
| `/` | `app/page.tsx` → `HomeView` | 오늘 레슨, 다음 레슨 카운트다운, 지난 레슨 목록, 완료 표시 |
| `/lesson/<날짜>` | `app/lesson/[date]/page.tsx` | 새 레슨(`LessonView`) 또는 복습 날(`ReviewDayView`). 빌드 시 날짜별 생성, 없는 날짜는 404 |
| `/review` | `app/review/page.tsx` → `ReviewView` | 공개된 모든 레슨의 단어 목록, 뜻 가리기 |

## 주요 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `LessonView` | 표시 설정 + 단어 캐러셀 + 문장 카드 + 문법 카드 + 완료 버튼 |
| `WordCarousel`, `WordCard` | 단어 카드 넘기기. 관사는 성별 색 (der 파랑, die 빨강, das 초록) |
| `SentenceCard`, `GrammarCard`, `SwissTip` | 문장, 문법, 스위스 팁 |
| `Pronunciation` | IPA와 한국어 발음 (강세 덩어리 강조) |
| `AudioRow`, `AudioButton` | 목소리별 일반/느리게 재생. 한 번에 한 음성만 재생 |
| `DisplayToggles` | IPA·한국어 발음 표시, 뜻·독일어 가리기 |
| `Maskable` | 가린 글자를 탭하면 보였다 다시 가렸다 |
| `ReviewDayView` | 주간 퀴즈(독일어→뜻, 뜻→독일어), 그 주 문장 다시 듣기 |
| `LockCountdown` | 공개 전 카운트다운 |
| `CompleteButton` | 학습 완료 기록 |
| `ServiceWorker` | 배포 환경에서만 `/sw.js` 등록 |

## 레슨 읽기와 초안 표시

`lib/lessons.ts`가 빌드할 때 `data/lessons/*.json`을 읽는다.

- 배포(`next build`): `approved: true`만 포함
- 개발(`next dev`) 또는 `SHOW_DRAFTS=1`: 검수 전 레슨도 포함하고 "검수 전" 표시
- 복습 날은 대상 레슨 중 하나라도 표시 가능할 때만 나온다

## 잠금과 시각

`lib/unlock.ts`

- 각 레슨은 `unlockAt`(그날 17:00 KST) 이후 내용이 보인다. 판정은 기기 시계 기준.
- 시각을 알기 전(서버 렌더링, 마운트 전)에는 빈 자리만 보여 잠긴 내용이 잠깐 보이지 않게 한다.
- 개발 모드에서만 `?now=2026-10-14T18:00`으로 시각을 바꿀 수 있다 (KST로 해석).

## 브라우저 저장

`lib/storage.ts`, 키 앞에 `std:`.

| 키 | 내용 |
|---|---|
| `std:settings` | `showIpa`, `showKorean`, `hideMeaning`, `hideGerman` |
| `std:completed` | 완료한 레슨 날짜 목록 |

서버로 보내지 않는다. 사파리 개인정보 보호 모드 등에서 저장이 안 되면 조용히 넘어간다.

## 오프라인 캐시

`public/sw.js` (캐시 이름 `std-v2`)

- `/audio/`, `/_next/static/`: 캐시 우선 (한번 받으면 계속 캐시 사용)
- 그 외 페이지: 네트워크 우선, 실패하면 캐시 (기차·산속 대비)

같은 파일명으로 음성을 교체하면 이미 캐시한 기기에는 반영되지 않는다. [operations.md](operations.md#알려진-이슈) 참고.

## PWA

`app/manifest.ts`, `app/layout.tsx`의 `appleWebApp`. 홈 화면에 추가하면 앱처럼 열린다. 테마 색 `#d52b1e` (스위스 빨강).

## 보안 헤더

`next.config.ts`

- 모든 경로: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Powered-By` 제거
- 배포에서만 CSP: 외부 리소스를 전혀 쓰지 않는다 (`default-src 'self'`). Next.js 인라인 스크립트 때문에 `script-src 'unsafe-inline'`이 필요하다.
- `.opus`는 `Content-Type: audio/ogg; codecs=opus`로 보낸다. 안 그러면 Safari가 재생하지 않는다.

외부 폰트·이미지·분석 도구를 추가하려면 CSP도 함께 고쳐야 한다. Forvo 링크는 새 창으로 이동하는 것이라 CSP 영향이 없다.

## 스타일

Tailwind CSS 4. 색 토큰은 `app/globals.css`의 `@theme`과 `:root` 변수(`--bg`, `--card`, `--text`, `--muted`, `--line`)에 있고, 다크 모드는 시스템 설정을 따른다. 모바일 기준 폭 `max-w-md`.
