# 개발·운영 문서

Swiss Trip Deutsch 개발과 운영에 참고할 문서 모음이다. 처음 설정하는 방법과 자주 쓰는 명령은 루트 [README.md](../README.md)에 있다.

| 문서 | 내용 | 언제 보나 |
|---|---|---|
| [architecture.md](architecture.md) | 전체 구조, 기술 스택, 폴더별 역할, 데이터 흐름 | 처음 코드를 볼 때 |
| [data-model.md](data-model.md) | 레슨 JSON, 스키마, themes.json, 검사 규칙 | 레슨 형식을 바꾸거나 검수할 때 |
| [content-pipeline.md](content-pipeline.md) | Gemini로 레슨 생성 → 검사 → 검수 → 승인 | 새 레슨을 만들 때 |
| [audio-tts.md](audio-tts.md) | Qwen3-TTS 음성 생성, Whisper 검사, 재생성 | 음성을 만들거나 고칠 때 |
| [web-app.md](web-app.md) | 페이지, 컴포넌트, 잠금 시각, 저장, 오프라인 캐시, 보안 헤더 | 화면을 고칠 때 |
| [operations.md](operations.md) | 정기 운영 일정, 배포, 체크리스트, 문제 해결, 알려진 이슈 | 매주 운영할 때 |

## 한눈에 보기

```
themes.json (Day별 테마·문법 계획)
   │  generate_lessons.py  ← Gemini API
   ▼
data/lessons/YYYY-MM-DD.json  (approved: false)
   │  validate_lessons.py → 사람이 검수 → approved: true
   │  generate_audio.py   ← Qwen3-TTS + Whisper (Mac 로컬)
   ▼
public/audio/YYYY-MM-DD/*.opus
   │  git push
   ▼
GitHub → Vercel 자동 배포 (정적 사이트, 매일 17:00 KST 공개)
```
