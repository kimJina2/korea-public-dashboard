# On-Device AI 영상 분석

## 개요

"나만의 영상" 페이지(`/dashboard/videos`)는 YouTube 영상을 다운로드하고, 브라우저에서 직접 실행되는 AI 모델로 특정 프레임을 분석하는 기능을 제공합니다. 서버에 이미지를 전송하지 않고 **모든 추론이 사용자 브라우저 내에서** 실행됩니다.

## 사용 모델

| 항목 | 내용 |
|------|------|
| 모델 | `HuggingFaceTB/SmolVLM-256M-Instruct` |
| 모델 크기 | 약 256MB (최초 1회 다운로드, 브라우저 캐시) |
| 모델 타입 | Vision Language Model (VLM) |
| 라이브러리 | `@huggingface/transformers` v3.x |
| 추론 백엔드 | WebGPU (지원 시) / ONNX WASM 폴백 |
| dtype | fp16 |

## 시스템 요구사항

| 항목 | 요구사항 |
|------|---------|
| 브라우저 | Chrome 113+, Edge 113+ (WebGPU 지원) |
| GPU | WebGPU 지원 GPU (Intel/AMD/NVIDIA) |
| RAM | 최소 4GB 권장 |
| 최초 로드 | 약 256MB 다운로드 필요 (이후 캐시) |

> WebGPU 미지원 환경에서는 ONNX WASM으로 자동 폴백되어 속도가 느려집니다.

## 아키텍처

```
videos/page.tsx (메인 UI)
    │
    ├── Web Worker (ai-worker.ts)
    │       │
    │       ├── load 메시지 → AutoProcessor + AutoModelForVision2Seq 로드
    │       └── analyze 메시지 → 이미지 분석 → TextStreamer 토큰 스트리밍
    │
    ├── <video> 태그 → /api/youtube/video/{id}.mp4 Range 스트리밍
    │
    └── Hidden <canvas> → video.currentTime 프레임 캡처 → base64 JPEG
```

## Web Worker 메시지 프로토콜

### 메인 → Worker

| type | 추가 필드 | 설명 |
|------|---------|------|
| `load` | - | 모델 로드 시작 |
| `analyze` | `imageDataUrl`, `prompt?`, `maxTokens?` | 이미지 분석 요청 |

### Worker → 메인

| type | 추가 필드 | 설명 |
|------|---------|------|
| `status` | `message` | 로드 상태 텍스트 업데이트 |
| `progress` | `progress` | 다운로드 진행률 (0~100) |
| `ready` | - | 모델 로드 완료 |
| `token` | `token` | 스트리밍 토큰 (실시간) |
| `done` | - | 분석 완료 |
| `error` | `message` | 오류 발생 |

## 프레임 캡처 방식

```typescript
// 영상 일시정지 후 캡처
const canvas = document.createElement("canvas");
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext("2d")?.drawImage(video, 0, 0);
const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
```

캡처된 프레임은 base64 JPEG로 인코딩되어 Web Worker에 전달됩니다.

## YouTube 다운로드

| 항목 | 내용 |
|------|------|
| 패키지 | `yt-dlp-wrap` |
| 바이너리 | `.ytdlp/yt-dlp.exe` (최초 실행 시 GitHub에서 자동 다운로드) |
| 다운로드 포맷 | `best[ext=mp4]` (ffmpeg 없이 단일 스트림) |
| 저장 위치 | `tmp_videos/{uuid}.mp4` |
| 스트리밍 | HTTP Range 요청 지원 (`/api/youtube/video/[filename]`) |

### ffmpeg 없이 다운로드하는 이유
`bestvideo+bestaudio` 병합 포맷은 ffmpeg가 필요합니다. 별도 설치 없이 동작하도록 `best[ext=mp4]` 단일 스트림 포맷을 사용합니다. 화질은 최대 720p 수준입니다.

### Vercel 배포 시 주의
Vercel 서버리스 환경에서는 파일시스템 쓰기 및 바이너리 실행이 제한됩니다. YouTube 다운로드 기능은 **로컬 개발 환경 전용**입니다.

## 기술적 제약 및 해결

### TypeScript lib 충돌
Web Worker에서 `/// <reference lib="webworker" />` 사용 시 tsconfig의 `lib: ["dom"]`과 충돌합니다.
→ reference 지시어 제거 후 `const ctx = self as any`로 타입 우회

### WebGPU 성능 경고
`powerPreference ignored on Windows`, `Some nodes not assigned to preferred EP` 등의 콘솔 경고는 정상입니다. 추론 자체는 동작합니다.

### 브라우저 캐시 용량 초과
`Unable to add response to browser cache: UnknownError` 경고는 256MB 모델이 브라우저 캐시 한도를 초과할 때 발생합니다. 모델은 메모리에서 정상 동작합니다.
