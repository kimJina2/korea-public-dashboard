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
