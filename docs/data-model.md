# 데이터 형식

## 파일 세 종류

| 파일 | 역할 | 누가 쓰나 |
|---|---|---|
| `data/themes/themes.json` | Day별 계획 | 사람 |
| `data/lessons/YYYY-MM-DD.json` | 하루치 레슨 또는 복습 날 | `generate_lessons.py` → 사람이 검수 |
| `data/schema/lesson.schema.json` | 레슨 형식 정의 (JSON Schema 2020-12) | 사람 |

스키마를 바꾸면 [types/lesson.ts](../types/lesson.ts)도 함께 바꾼다. 두 파일은 같은 구조여야 한다.

## themes.json

```jsonc
{
  "startDate": "2026-10-04",   // Day 1 날짜
  "totalDays": 365,
  "themes": [
    {
      "day": 3, "week": 1, "type": "lesson",   // "lesson" | "review"
      "id": "sbb-ticket", "title": "SBB 승차권", "emoji": "🎫",
      "scenarios": ["매표소·발권기에서 표 사기", ...],
      "swissTerms": ["das Billett", "das Halbtax", "retour"],
      "grammarFocus": { "id": "wie-viel-kostet", "title": "..." }
    }
  ]
}
```

- 한 주 = 새 레슨 6개 + 복습 1개. 7, 14, 21…일째가 `review`.
- 현재 Day 35(5주차, 2026-11-07)까지만 계획되어 있다. 이후는 커리큘럼을 정한 뒤 추가한다.
- `startDate`를 바꾸면 모든 레슨의 날짜·파일명·`unlockAt`·음성 경로가 어긋난다. 바꿀 일이 있으면 전부 다시 만들어야 한다.

## 레슨 (`type: "lesson"`)

```jsonc
{
  "type": "lesson",
  "schemaVersion": 1,
  "date": "2026-10-06",                     // 파일명과 같다
  "day": 3,
  "unlockAt": "2026-10-06T17:00:00+09:00",  // 항상 그날 17:00 KST
  "theme": { "id": "sbb-ticket", "title": "SBB 승차권", "emoji": "🎫" },
  "approved": false,                        // 검수 후 true
  "words": [ /* 10개 */ ],
  "sentences": [ /* 3개 */ ],
  "grammar": { /* 1개 */ }
}
```

### 단어

| 필드 | 설명 |
|---|---|
| `id` | `word-01` … `word-10` (순서대로) |
| `german` | 명사는 관사 포함: `das Billett` |
| `meaning` | 한국어 뜻 |
| `partOfSpeech` | `noun`, `verb`, `adjective`, `adverb`, `preposition`, `pronoun`, `interjection`, `phrase` |
| `gender`, `plural` | 명사만. `gender`는 관사와 같아야 하고 `plural`은 `die …` 또는 `null` |
| `pronunciation.ipa` | 기준 발음. 관사 없이, 강세 `ˈ` 포함 |
| `pronunciation.korean` | `[{ "text": "빌", "stress": false }, ...]` 강세는 정확히 1개 |
| `isSwissExpression` | 스위스 표현 여부. 레슨마다 1~2개, `true`면 `swissNote` 필수 |
| `audio` | `{ aiden: { normal, slow }, serena: { normal, slow } }` (스크립트가 채움) |

### 문장

`id`(`sentence-01`…), `german`(10단어 이하), `meaning`, `pronunciation`(한국어 덩어리 수 = 단어 수), `usesWords`(오늘 단어 id 1개 이상), `audio`, 선택 `swissNote`.

### 문법

`id`(themes.json의 `grammarFocus.id`와 같아야 함), `title`, `pattern`, `meaning`, `explanation`, `examples`(2개 이상), 선택 `tip`.

## 복습 날 (`type: "review"`)

```json
{
  "type": "review", "schemaVersion": 1,
  "date": "2026-10-10", "day": 7,
  "unlockAt": "2026-10-10T17:00:00+09:00",
  "theme": { "id": "review-week-01", "title": "1주차 복습", "emoji": "🔁" },
  "approved": true,
  "reviewOf": ["2026-10-04", "2026-10-05", "..."]
}
```

내용 없이 그 주 레슨 날짜만 가리킨다. Gemini를 쓰지 않고 바로 승인된 상태로 만들어지며 음성도 따로 없다. 화면에서는 `reviewOf` 레슨 중 표시 가능한(승인되고 공개된) 것만 쓴다.

## 음성 경로 규칙

```
/audio/<date>/<id>-<voice>.opus
/audio/<date>/<id>-<voice>-slow.opus
```

예: `/audio/2026-10-06/word-03-serena-slow.opus`. 검사기가 이 규칙을 확인한다.

## 자동 검사 항목

`validate_lessons.py`와 `generate_lessons.py`가 같은 검사기(`generator/validators/`)를 쓴다.

| 검사 | 파일 | 내용 |
|---|---|---|
| 스키마 | `schema_check.py` | 필드, 타입, 개수, 형식 |
| 독일어 규칙 | `german_check.py` | id 순서, 관사-gender 일치, 명사 대문자, 복수형 `die …`, 강세 1개, IPA 강세 기호, 스위스 표현 1~2개와 `swissNote`, 문장 길이, `usesWords`, 발음 덩어리 수, 음성 경로 |
| 기대값 | `validate_lessons.py` | 날짜·`unlockAt`·테마·type·grammar id가 themes.json과 맞는지 |
| 중복 | `duplicate_check.py` | 레슨 사이 표제어(관사 무시, 소문자) 중복, 문장 중복 |

검사가 통과해도 독일어가 맞다는 보장은 아니다. 성(gender), 스위스에서 실제로 쓰는지, 번역 자연스러움은 사람이 검수한다 ([content-pipeline.md](content-pipeline.md)).
