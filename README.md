# 🇰🇷 한국 공공데이터 대시보드

한국 공공데이터포털(data.go.kr) 및 서울시 열린데이터 광장 API를 활용한 실시간 대기질, 날씨, 교통, 지하철 정보 대시보드 서비스입니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🌫️ **대기질** | 전국 시도별 PM10, PM2.5, 오존, 이산화질소, 통합대기환경지수 실시간 제공 |
| 🌤️ **날씨** | 기상청 단기예보 기반 기온, 강수확률, 습도, 풍속 등 3시간 간격 예보 |
| 🚌 **버스 노선** | 전국 주요 도시 시내버스 노선 번호, 운행 시간, 배차 간격 정보 |
| 🚇 **서울 지하철 실시간** | 서울 지하철 1~9호선 실시간 열차 위치 · 운행 상태 · 급행 여부 시각화 |

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **스타일링**: Tailwind CSS v4
- **인증**: NextAuth.js v5 (Google OAuth 2.0)
- **데이터베이스**: Turso (SQLite, LibSQL) + Drizzle ORM
- **차트**: Recharts
- **데이터 페칭**: SWR
- **배포**: Vercel

## 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd korea-public-dashboard
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
# NextAuth
AUTH_SECRET=<랜덤 시크릿 키>
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>

# Turso DB
TURSO_DATABASE_URL=libsql://<database>.turso.io
TURSO_AUTH_TOKEN=<token>

# 공공데이터포털 API 키 (대기질 / 날씨 / 교통)
DATA_GO_KR_API_KEY=<API 키 (디코딩된 형태)>

# 서울시 열린데이터 광장 API 키 (지하철)
SEOUL_SUBWAY_API_KEY=<API 키>

# AI 영상 분석 (Groq)
GROQ_API_KEY=<Groq API 키>
```

### 3. DB 초기화 및 시드

```bash
npm run db:seed
```

kts123@kookmin.ac.kr 계정이 허용 사용자 목록에 자동 추가됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 로그인 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   ├── actions.ts                # Server Actions (로그인/로그아웃)
│   ├── dashboard/
│   │   ├── layout.tsx            # 대시보드 레이아웃 (네비게이션)
│   │   ├── nav-links.tsx         # 네비게이션 링크 (클라이언트 컴포넌트)
│   │   ├── logout-button.tsx     # 로그아웃 버튼 (클라이언트 컴포넌트)
│   │   ├── page.tsx              # 대시보드 홈
│   │   ├── air-quality/page.tsx  # 대기질 페이지
│   │   ├── weather/page.tsx      # 날씨 페이지
│   │   ├── transit/page.tsx      # 교통 페이지
│   │   ├── subway/
│   │   │   ├── page.tsx          # 지하철 실시간 페이지 (SVG 노선도)
│   │   │   └── station-data.ts   # 1~9호선 역 목록 · 분기선 데이터
│   │   ├── videos/page.tsx       # 나만의영상 페이지 (YouTube + AI 분석)
│   │   └── board/                # 게시판 (목록, 상세, 작성)
│   ├── api/
│   │   ├── air-quality/route.ts  # 대기질 API
│   │   ├── weather/route.ts      # 날씨 API
│   │   ├── transit/route.ts      # 교통 API
│   │   ├── subway/route.ts       # 지하철 실시간 API (서울시 열린데이터)
│   │   └── youtube/
│   │       ├── download/route.ts # YouTube 다운로드 (yt-dlp)
│   │       └── analyze/route.ts  # AI 영상 분석 (Groq)
│   └── auth/[...nextauth]/       # NextAuth 핸들러
├── auth.ts                       # NextAuth 설정
├── proxy.ts                       # 라우트 보호 (Next.js 미들웨어)
├── lib/
│   ├── db.ts                     # Drizzle DB 클라이언트
│   ├── schema.ts                 # DB 스키마 (allowed_users, access_log)
│   ├── allowed-users.ts          # 허용 사용자 관리
│   └── utils.ts                  # 유틸리티 함수
├── hooks/
│   ├── use-air-quality.ts        # 대기질 SWR 훅
│   ├── use-weather.ts            # 날씨 SWR 훅
│   └── use-transit.ts            # 교통 SWR 훅
└── types/
    ├── air-quality.ts            # 대기질 타입
    ├── weather.ts                # 날씨 타입
    └── transit.ts                # 교통 타입
```

## 접근 제어

- Google OAuth를 통해 로그인
- Turso DB의 `allowed_users` 테이블에 등록된 이메일만 접근 가능
- `is_active = true` 인 사용자만 허용
- 허용되지 않은 계정으로 로그인 시도 시 로그인 페이지로 리다이렉트

### 허용 사용자 관리

Turso DB에 직접 쿼리하거나 seed 스크립트를 수정하여 허용 사용자를 추가할 수 있습니다:

```sql
INSERT INTO allowed_users (email, name, created_at, is_active)
VALUES ('user@example.com', '사용자 이름', datetime('now'), 1);
```

## 공공데이터 API

| 서비스 | 출처 | 갱신 주기 |
|--------|------|---------|
| 대기질 | 한국환경공단 에어코리아 실시간 측정정보 조회 (apis.data.go.kr) | 5분 |
| 날씨 | 기상청 단기예보 조회서비스 (apis.data.go.kr) | 1시간 |
| 교통 | 국토교통부 버스노선 조회서비스 (apis.data.go.kr) | 1시간 |
| 지하철 | 서울시 열린데이터 광장 실시간 지하철위치정보 (data.seoul.go.kr) | 30초 |

- 대기질 / 날씨 / 교통 API 키: [공공데이터포털](https://www.data.go.kr)에서 신청
- 지하철 API 키: [서울시 열린데이터 광장](https://data.seoul.go.kr)에서 신청

### 서울 지하철 실시간 기능 상세

- **지원 노선**: 1호선 ~ 9호선 (총 9개 노선)
- **SVG 노선도**: 역 순서 시각화 + 열차 마커 (상행/하행 위치 표시)
- **분기 노선**: 2호선 성수지선·신정지선, 5호선 마천지선 지원
- **열차 상태**: 운행중 / 진입 / 도착 / 출발 / 전역출발 / 급행통과
- **필터**: 상행 / 하행 / 전체 방향별 필터링
- **자동 갱신**: 30초마다 자동 새로고침

## Vercel 배포

GitHub 저장소를 Vercel에 연결하면 `main` 브랜치에 푸시할 때 자동 배포됩니다.

Vercel 환경 변수에 아래 값을 설정해야 합니다:
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `DATA_GO_KR_API_KEY`
- `SEOUL_SUBWAY_API_KEY`
- `GROQ_API_KEY`

> Google OAuth 리다이렉트 URI에 Vercel 배포 URL을 추가해야 합니다.
> 예: `https://your-app.vercel.app/api/auth/callback/google`

## 문서

- [아키텍처 문서](./docs/architecture.md)
- [환경 설정 가이드](./docs/setup.md)
- [API 연동 가이드](./docs/api-guide.md)
