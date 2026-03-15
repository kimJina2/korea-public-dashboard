# 아키텍처 문서

## 전체 구조

```
사용자 브라우저
    │
    ▼
Vercel Edge (Middleware)
    │  ← JWT 세션 확인 → 미인증 시 /로 리다이렉트
    │
    ▼
Next.js App Router
    ├── /                         (로그인 페이지)
    ├── /dashboard                (대시보드 홈)
    ├── /dashboard/air-quality    (오늘의 정보: 대기질·날씨·교통 통합)
    ├── /dashboard/board          (게시판)
    ├── /dashboard/videos         (나만의 영상 - On-Device AI 분석)
    └── /api/*                    (API 라우트, 인증 필요)
         │
         ▼
    ├── 공공데이터포털 API (data.go.kr)
    ├── Turso DB (LibSQL) - 게시판·인증·프로필
    └── YouTube (yt-dlp-wrap 다운로드)
```

## 인증 흐름

### Google OAuth 로그인
```
1. 사용자 → "Google 로그인" 클릭
2. Google OAuth 화면
3. Google → callback: /api/auth/callback/google
4. NextAuth signIn 콜백:
   - Turso DB의 allowed_users 테이블 조회
   - 이메일 허용 여부 확인
   - 허용 → 세션 생성 → /dashboard 리다이렉트
   - 비허용 → 로그인 거부 → / 리다이렉트
5. Middleware: /dashboard/* 요청마다 세션 확인
```

> Google Workspace 계정(@kookmin.ac.kr 등)은 대학 SAML SSO 정책으로 Google OAuth 로그인이 불가합니다. 이메일 OTP 로그인을 이용하세요.

### 이메일 OTP 로그인
```
1. 사용자 → 이메일 입력 → "인증코드 받기" 클릭
2. POST /api/auth/send-otp:
   - allowed_users 테이블에서 이메일 허용 여부 확인
   - 6자리 랜덤 코드 생성 → email_otps 테이블 저장 (10분 만료)
   - Gmail SMTP(Nodemailer)로 인증코드 발송
3. 사용자 → 6자리 코드 입력 → "로그인" 클릭
4. NextAuth Credentials 프로바이더(email-otp):
   - allowed_users 확인
   - email_otps 테이블에서 코드 유효성 검증 (미사용·미만료)
   - 검증 성공 → OTP used=true 업데이트 → 세션 생성 → /dashboard 리다이렉트
5. 세션 유효시간: 20분
```

## 데이터 흐름

### 공공데이터 (대기질·날씨·교통)
```
클라이언트 컴포넌트 (useAirQuality / useWeather / useTransit)
    │  SWR fetch
    ▼
Next.js API 라우트 (/api/air-quality, /api/weather, /api/transit)
    │  세션 인증 확인
    │  fetch (서버 → 외부 API)
    ▼
공공데이터포털 API
    │
    ▼
JSON 응답 → SWR 캐시 → UI 렌더링
```

### YouTube 영상 다운로드 및 AI 분석
```
클라이언트 (videos/page.tsx)
    │  1. POST /api/youtube/download (URL 전송)
    ▼
서버 API 라우트
    │  yt-dlp-wrap: .ytdlp/yt-dlp.exe 로 영상 다운로드
    │  → tmp_videos/{uuid}.mp4 저장
    │  응답: { videoUrl, title }
    ▼
클라이언트 <video> 태그
    │  GET /api/youtube/video/{filename} (Range 스트리밍)
    │  사용자: 일시정지 → "화면 분석" 클릭
    ▼
Hidden <canvas> → toDataURL("image/jpeg") → base64 이미지
    │  Web Worker (ai-worker.ts) postMessage
    ▼
SmolVLM-256M (WebGPU / ONNX)
    │  TextStreamer → 토큰 단위 스트리밍 응답
    ▼
UI에 실시간 분석 텍스트 출력
```

### 게시판
```
클라이언트 (board/)
    │  fetch
    ▼
/api/board/posts, /api/board/comments, /api/board/reactions
    │  세션 인증
    ▼
Turso DB (posts, comments, comment_reactions 테이블)
```

## 데이터베이스 스키마

### allowed_users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| email | TEXT UNIQUE | 사용자 이메일 |
| name | TEXT | 사용자 이름 |
| created_at | TEXT | 등록 일시 |
| added_by | TEXT | 등록자 |
| is_active | INTEGER | 활성 여부 (1=활성) |

### email_otps
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| email | TEXT | 요청 이메일 |
| otp | TEXT | 6자리 인증코드 |
| expires_at | TEXT | 만료 시각 (발급 후 10분) |
| used | INTEGER | 사용 여부 (0=미사용, 1=사용됨) |
| created_at | TEXT | 생성 일시 |

### access_log
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| email | TEXT | 사용자 이메일 |
| action | TEXT | 행동 유형 |
| timestamp | TEXT | 발생 시각 |
| ip_address | TEXT | IP 주소 |

### user_profiles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| email | TEXT PK | 사용자 이메일 |
| display_name | TEXT | 표시 이름 |
| avatar_url | TEXT | 프로필 이미지 URL |
| language | TEXT | 선호 언어 (ko/en/ja/zh/fr/de/es) |
| updated_at | TEXT | 수정 일시 |

### posts
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| author_email | TEXT | 작성자 이메일 |
| title | TEXT | 제목 |
| content | TEXT | 내용 |
| created_at | TEXT | 작성 일시 |
| updated_at | TEXT | 수정 일시 |

### comments
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| post_id | INTEGER FK | 게시글 ID |
| author_email | TEXT | 작성자 이메일 |
| content | TEXT | 댓글 내용 |
| created_at | TEXT | 작성 일시 |

### comment_reactions
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 |
| comment_id | INTEGER FK | 댓글 ID |
| user_email | TEXT | 반응한 사용자 |
| emoji | TEXT | 이모지 종류 |
| created_at | TEXT | 반응 일시 |

## 캐싱 전략

| 데이터 | 캐시 위치 | TTL |
|--------|---------|-----|
| 대기질 | Next.js fetch cache | 5분 |
| 날씨 | Next.js fetch cache | 1시간 |
| 교통 | Next.js fetch cache | 1시간 |
| 클라이언트 재검증 | SWR refreshInterval | 상동 |
| YouTube 영상 | tmp_videos/ 로컬 파일 | 영구 (수동 삭제) |

## 다국어(i18n)

`src/lib/i18n.ts`에 7개 언어 번역 키를 관리합니다.

| 언어 | 코드 |
|------|------|
| 한국어 | ko |
| 영어 | en |
| 일본어 | ja |
| 중국어(간체) | zh |
| 프랑스어 | fr |
| 독일어 | de |
| 스페인어 | es |

`useLanguage()` 훅으로 현재 언어 및 번역 객체 `t`에 접근합니다. 선호 언어는 `user_profiles.language`에 서버 저장, `localStorage`에 클라이언트 캐시됩니다.
