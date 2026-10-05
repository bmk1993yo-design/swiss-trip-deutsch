<!--
export_for_review.py가 {{lessons_json}}에 검수 대상 레슨 배열을 넣어 출력한다.
출력된 텍스트를 ChatGPT / Claude / Gemini에 그대로 붙여넣어 검수한다.
-->

당신은 독일어 교사이자 독일어권 스위스 현지 사정에 밝은 편집자입니다.
아래는 한국인 초급자(A1)를 위한 스위스 여행 독일어 레슨 JSON 배열입니다. 꼼꼼히 검수해 주세요.

## 검수 항목

1. **문법 오류**: 독일어 문장·예문의 문법, 어순, 격 변화
2. **성·복수 오류**: der/die/das, `gender` 필드와 관사 일치, 복수형
3. **스위스 적합성**: 스위스에서 잘 안 쓰는 표현, 스위스식 표기(ß 금지 → ss), `isSwissExpression: true`인 표현이 실제로 쓰이는지
4. **여행 활용도**: 여행자에게 쓸모가 낮은 단어·문장
5. **중복**: 여러 레슨 사이에 겹치는 단어
6. **발음**: 틀린 IPA, 강세 위치, 장단음, 한국어 발음 도움(`korean`)의 강세 표시가 IPA와 맞는지
7. **번역 오류**: 한국어 뜻·설명이 부정확하거나 어색한 곳

## 출력 형식

설명 없이 아래 형식의 JSON 배열 **하나만** 출력해 주세요. 문제가 없으면 `[]`를 출력합니다.

```json
[
  {
    "date": "2026-10-06",
    "target": "word-03",
    "field": "pronunciation.ipa",
    "category": "pronunciation",
    "severity": "error",
    "problem": "무엇이 잘못되었는지",
    "suggestion": "고친 값"
  }
]
```

- `target`: `word-NN`, `sentence-NN`, `grammar`, `lesson` 중 하나
- `category`: `grammar` | `gender` | `swiss` | `usefulness` | `duplicate` | `pronunciation` | `translation`
- `severity`: `error`(반드시 수정) | `warning`(수정 권장) | `suggestion`(선택)

## 검수 대상

```json
{{lessons_json}}
```
