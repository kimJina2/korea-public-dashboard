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
    ├── /                    (로그인 페이지)
    ├── /dashboard           (대시보드 홈)
    ├── /dashboard/air-quality
    ├── /dashboard/weather
    ├── /dashboard/transit
    └── /api/*               (API 라우트, 인증 필요)
         │
         ▼
공공데이터포털 API (data.go.kr)
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

## 캐싱 전략

| 데이터 | 캐시 위치 | TTL |
|--------|---------|-----|
| 대기질 | Next.js fetch cache | 5분 |
| 날씨 | Next.js fetch cache | 1시간 |
| 교통 | Next.js fetch cache | 1시간 |
| 클라이언트 재검증 | SWR refreshInterval | 상동 |
