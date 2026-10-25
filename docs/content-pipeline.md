# 레슨 생성 → 검수

모든 명령은 저장소 루트에서 가상환경을 켠 뒤 실행한다.

```bash
source .venv/bin/activate
```

## 1. 생성

```bash
python generator/generate_lessons.py --days 11-20         # 아직 없는 날만
python generator/generate_lessons.py --days 12 --overwrite # 다시 생성
python generator/generate_lessons.py --days 11 --dry-run   # 프롬프트만 보기 (API 호출 없음)
python generator/generate_lessons.py --list-models        # 쓸 수 있는 Gemini 모델
```

`--days`는 Day 번호다 (날짜 아님). `5`, `2-10`, `2,4,6` 모두 된다.

### 내부 동작

1. `themes.json`에서 그날 테마를 읽는다. `type: "review"`면 Gemini 없이 복습 날을 만들고 끝.
2. 프롬프트([generator/prompts/lesson_prompt.md](../generator/prompts/lesson_prompt.md))의 `# SYSTEM` / `# USER`를 나누고 자리표시자를 채운다.
   - `{{used_words}}`: 다른 레슨에서 이미 쓴 표제어 (중복 방지)
   - `{{example_lesson}}`: 형식 예시. `config.py`의 `EXAMPLE_LESSON`(현재 `2026-10-04.json`)에서 audio를 뺀 것
3. `lesson.schema.json`에서 Gemini가 지원하지 않는 키워드를 뺀 스키마를 구조화 출력으로 넘긴다.
4. 응답에 날짜, `unlockAt`, 테마, 음성 경로를 채우고 검사한다. 실패하면 오류 목록을 붙여 최대 3번 다시 요청한다.
5. 3번 모두 실패하면 마지막 결과를 `generator/tmp/failed/<날짜>.json`에 남기고 종료 코드 1.

### Gemini 설정 (`.env`)

| 변수 | 설명 |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | 기본 모델 (`.env.example`: `gemini-3.6-flash`) |
| `GEMINI_FALLBACK_MODEL` | 기본 모델이 503/429로 2번 실패하면 그 요청만 이 모델로 |

무료 tier라 503(혼잡)·429(분당 한도)가 잦다. 20초, 40초… 기다리며 최대 6번 시도한다. 여러 날을 한꺼번에 만들면 시간이 걸리는 것이 정상이다.

### 실패했을 때

- `tmp/failed/<날짜>.json`을 열어 오류를 직접 고친 뒤 `data/lessons/`로 옮기거나, `--overwrite`로 다시 생성한다.
- 같은 오류가 반복되면 프롬프트의 규칙을 보강한다. 프롬프트에 자주 틀리는 예(성, 고정 표현)가 이미 정리되어 있다.

## 2. 자동 검사

```bash
python generator/validate_lessons.py             # 전체
python generator/validate_lessons.py 2026-10-14  # 특정 날짜만 (중복 검사는 항상 전체)
```

문제가 있으면 종료 코드 1. push 전에 항상 실행한다. 검사 항목은 [data-model.md](data-model.md#자동-검사-항목).

## 3. 사람 검수

화면으로 보는 것이 가장 빠르다.

```bash
npm run dev
# http://localhost:3000/lesson/2026-10-14?now=2026-10-14T18:00
```

개발 모드에서는 검수 전 레슨도 "검수 전" 표시와 함께 보인다.

확인할 것:

- [ ] 명사의 성(der/die/das)과 복수형
- [ ] 스위스에서 실제로 쓰는 말인지, `ß` 대신 `ss`인지
- [ ] `isSwissExpression` 표현이 정말 스위스 표현인지, `swissNote`가 맞는지
- [ ] 여행 중에 쓸 만한 단어·문장인지
- [ ] IPA와 한국어 발음의 강세 위치가 같은지
- [ ] 한국어 뜻·설명이 자연스러운지 (존댓말)
- [ ] 문법 설명과 예문이 그날 문법(`grammarFocus`)과 맞는지

외부 LLM에 교차 검수를 맡기고 싶으면 [generator/prompts/review_prompt.md](../generator/prompts/review_prompt.md)의 검수 지시문을 쓴다. 주석에 나오는 `export_for_review.py`는 아직 없으므로 레슨 JSON을 직접 붙여 넣는다.

## 4. 승인

문제없으면 JSON의 `"approved": false`를 `true`로 바꾼다. 내용을 고쳤다면 `validate_lessons.py`를 다시 돌린다.

- 단어·문장 텍스트를 고쳤으면 그 항목의 음성을 다시 만들어야 한다 ([audio-tts.md](audio-tts.md)).
- 승인하지 않은 레슨은 배포 사이트에 나오지 않는다. 그 주 레슨이 하나도 승인되지 않으면 복습 날도 나오지 않는다.

## 5. 음성 → 배포

[audio-tts.md](audio-tts.md), [operations.md](operations.md#배포) 참고.
