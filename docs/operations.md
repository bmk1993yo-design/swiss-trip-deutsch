# 운영

## 일정 계산

- Day N 날짜 = `2026-10-04 + (N - 1)일`. 공개는 그날 17:00 KST.
- 7, 14, 21, 28, 35일째는 복습 날 (자동 생성, 음성 없음).
- 공개 전에 **승인 + 음성 + 배포**까지 끝나 있어야 한다. 배포는 몇 분 걸리므로 당일 오후에 하지 말고 며칠 치를 미리 올린다.

| Day | 날짜 | | Day | 날짜 |
|---|---|---|---|---|
| 1 | 2026-10-04 | | 21 (복습) | 2026-10-24 |
| 7 (복습) | 2026-10-10 | | 28 (복습) | 2026-10-31 |
| 14 (복습) | 2026-10-17 | | 35 (복습) | 2026-11-07 |

## 주간 루틴 (권장)

한 주(7일) 치를 한 번에 준비한다.

```bash
source .venv/bin/activate

# 1. 생성 (예: 3주차 = Day 15-21)
python generator/generate_lessons.py --days 15-21

# 2. 검사
python generator/validate_lessons.py

# 3. 검수 → approved: true  (content-pipeline.md 체크리스트)

# 4. 음성 (레슨 6개 ≈ 312파일)
python generator/generate_audio.py
#    → generator/tmp/listen_report.md 들어 보고 체크, 필요하면 다시 만들기

# 5. 마지막 확인
python generator/validate_lessons.py
npm run build          # 배포와 같은 조건으로 빌드되는지
npm run dev            # ?now= 로 해당 날짜 확인

# 6. 배포
git add data public/audio
git commit -m "Add Day 15-21 lessons and audio"
git push
```

## 배포

- `main`에 push하면 Vercel이 자동 빌드·배포한다.
- 배포 결과는 Vercel 대시보드에서 확인한다. 빌드가 실패하면 이전 버전이 계속 서비스된다.
- 배포 후 실제 사이트에서 오늘 레슨과 음성 재생을 한 번 확인한다.
- 환경 변수 `SHOW_DRAFTS`는 배포 환경에서 설정하지 않는다 (설정하면 검수 전 레슨이 공개된다).

## 배포 전 체크리스트

- [ ] `validate_lessons.py` 문제 0건
- [ ] 공개할 레슨이 모두 `approved: true`
- [ ] 공개할 레슨의 음성 파일이 모두 있음 (`generate_audio.py`가 "만들 음성이 없습니다"라고 나옴)
- [ ] `listen_report.md`의 해당 날짜 항목 확인 완료
- [ ] `npm run build` 성공
- [ ] `.env`, `generator/tmp/`가 커밋에 들어가지 않음 (`.gitignore` 처리됨)

## 이미 공개한 레슨을 고칠 때

- 텍스트만 고침: JSON 수정 → 검사 → push.
- 단어·문장의 독일어를 고침: 그 항목 음성도 다시 생성 (`--item`).
- 단어를 다른 단어로 바꿈: 다른 레슨과 중복되지 않는지 `validate_lessons.py`로 확인.
- 사용자의 완료 기록은 날짜로 저장되므로 내용을 고쳐도 유지된다.

## 문제 해결

| 증상 | 원인·조치 |
|---|---|
| 새 레슨이 사이트에 안 나옴 | `approved`가 false이거나, 아직 17:00 전이거나, push/배포가 안 됨 |
| 복습 날이 안 나옴 | 그 주 레슨이 하나도 승인되지 않음 |
| 로컬에서는 보이는데 배포에선 안 보임 | 개발 모드는 초안도 보여 준다. `npm run build && npm start`로 확인 |
| `?now=`가 안 먹음 | 개발 모드에서만 동작 |
| 음성이 재생 안 됨 (Safari) | `.opus` Content-Type 헤더 확인 (`next.config.ts`) |
| 음성을 바꿨는데 예전 소리 | 브라우저 캐시·서비스 워커 캐시. ⌘+Shift+R, 앱은 사이트 데이터 삭제 |
| `GEMINI_API_KEY가 없습니다` | `.env`에 키 입력 |
| Gemini 503/429 반복 | 무료 tier 혼잡·한도. 잠시 뒤 다시 실행, 이미 만든 날은 건너뛴다 |
| 생성 3회 실패 | `generator/tmp/failed/<날짜>.json` 확인 후 직접 고치거나 `--overwrite` |
| 음성 생성 중 `ffmpeg` 오류 | `brew install ffmpeg` |

## 알려진 이슈

- **서비스 워커 음성 캐시**: `sw.js`는 `/audio/`를 캐시 우선으로 쓰고 파일명이 같으면 새로 받지 않는다. 이미 공개된 음성을 교체했다면 `public/sw.js`의 `CACHE` 이름을 올려야(`std-v1` → `std-v2`) 홈 화면 앱 사용자에게도 반영된다.
- **커리큘럼 범위**: `themes.json`은 Day 35(2026-11-07)까지만 있다. 그 전에 Day 36 이후 계획을 추가해야 한다.
- **`review_prompt.md`**: 주석의 `export_for_review.py`가 저장소에 없다. 지금은 JSON을 직접 붙여 넣어 쓴다.
- **잠금은 화면에서만**: 빌드 결과물에 미래 레슨 내용이 들어 있다. 학습 리듬용이지 보안 장치가 아니다.
- **Mac 의존**: 음성 생성은 Apple Silicon Mac에서만 된다. 레슨 생성·검사는 어디서나 된다.

## 비밀 정보

- `GEMINI_API_KEY`는 로컬 `.env`에만 둔다. 웹앱은 키를 쓰지 않으므로 Vercel에 넣을 필요가 없다.
- 키가 노출되면 AI Studio에서 키를 지우고 새로 발급한다.
