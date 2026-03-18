# 영상 분석 & YouTube 다운로드

## 개요

"나만의 영상" 페이지(`/dashboard/videos`)는 YouTube 영상을 다운로드하고, AI API로 특정 프레임을 분석하는 기능을 제공합니다.

---

## 아키텍처

```
videos/page.tsx (메인 UI)
    │
    ├── POST /api/youtube/download
    │       └── yt-dlp_linux 바이너리로 영상 다운로드
    │           → 영상 바이너리 직접 반환 (video/mp4)
    │           → 클라이언트에서 URL.createObjectURL(blob)
    │
    ├── <video> 태그 → Blob URL 로컬 재생
    │
    ├── Hidden <canvas> → video.currentTime 프레임 캡처 → base64 JPEG
    │
    └── POST /api/youtube/analyze
            └── Groq API (Llama 4 Scout) → 한국어 분석 결과 반환
```

---

## YouTube 다운로드

| 항목 | 내용 |
|------|------|
| 패키지 | `yt-dlp-wrap` |
| 바이너리 | Linux: `yt-dlp_linux` (GitHub에서 직접 다운로드), Windows: `YTDlpWrap.downloadFromGithub()` |
| 다운로드 포맷 | `18/best[ext=mp4]/best` (ffmpeg 없이 단일 스트림) |
| 저장 위치 | `/tmp/yt_videos/{uuid}.mp4` (임시) |
| 영상 전달 | 바이너리를 직접 응답으로 반환 → Blob URL |
| 인증 | `YT_COOKIES_B64` 환경변수 (base64 인코딩된 Netscape 쿠키) |
| JS 런타임 | `--js-runtimes node:${process.execPath}` (YouTube n-challenge 해결) |

### 환경변수

| 변수 | 설명 |
|------|------|
| `YT_COOKIES_B64` | YouTube 쿠키 파일을 base64로 인코딩한 값. Vercel 서버 IP 봇 차단 우회에 필요 |
| `GROQ_API_KEY` | 화면 분석 API 키 (console.groq.com에서 무료 발급) |

### 쿠키 설정 방법

```powershell
# Chrome 확장: "Get cookies.txt LOCALLY" 설치 후 youtube.com 쿠키 내보내기
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\path\youtube_cookies.txt")) | clip
# 클립보드 내용을 Vercel > Settings > Environment Variables > YT_COOKIES_B64 에 붙여넣기
```

### Vercel 배포 시 구조

Vercel 서버리스 함수는 요청마다 별도 인스턴스를 사용하므로 `/tmp` 파일을 다른 요청에서 접근할 수 없습니다.
→ 다운로드 API가 영상 파일을 읽어 **바이너리 응답으로 직접 반환**, 클라이언트에서 `URL.createObjectURL(blob)`으로 재생합니다.

### ffmpeg 없이 다운로드하는 이유

`bestvideo+bestaudio` 병합 포맷은 ffmpeg가 필요합니다. 별도 설치 없이 동작하도록 `best[ext=mp4]` 단일 스트림 포맷 사용. 화질은 최대 720p 수준입니다.

---

## 화면 분석 AI

| 항목 | 내용 |
|------|------|
| API | Groq API |
| 모델 | `meta-llama/llama-4-scout-17b-16e-instruct` |
| 요금 | 무료 (console.groq.com 가입 후 API 키 발급) |
| 언어 | 앱 언어 설정에 따라 자동 적용 (ko/en/ja/es/fr/zh/vi) |
| 엔드포인트 | `POST /api/youtube/analyze` |

### 요청/응답

```typescript
// 요청
{ imageDataUrl: string, prompt: string, lang: string, maxTokens: number }

// 응답
{ result: string }
```

---

## 트러블슈팅 히스토리

### yt-dlp 바이너리 문제 (Vercel)
- **증상**: `env: 'python3': No such file or directory`
- **원인**: `YTDlpWrap.downloadFromGithub()`이 Python 스크립트 버전(`yt-dlp`) 다운로드
- **해결**: Linux에서 `yt-dlp_linux` (독립 실행 바이너리)를 직접 fetch로 다운로드

### YouTube 봇 차단
- **증상**: `Sign in to confirm you're not a bot`
- **원인**: Vercel 서버 IP를 YouTube가 봇으로 차단
- **해결**: 로그인된 YouTube 쿠키를 `YT_COOKIES_B64` 환경변수로 주입

### n-challenge 실패
- **증상**: `n challenge solving failed: Some formats may be missing`
- **원인**: YouTube n-challenge 해결에 JS 런타임 필요
- **해결**: `--js-runtimes node:${process.execPath}` 추가

### 영상 재생 404
- **증상**: `/api/youtube/video/{id}.mp4` 404 Not Found
- **원인**: Vercel 서버리스 인스턴스 간 `/tmp` 파일 공유 불가
- **해결**: 다운로드 API에서 영상 바이너리를 직접 반환, 클라이언트에서 Blob URL 생성

### 분석 결과 영어 출력
- **원인**: SmolVLM-256M (브라우저 온디바이스 모델)이 너무 소형 → 언어 지시 무시
- **해결**: 서버사이드 Groq API로 전환
