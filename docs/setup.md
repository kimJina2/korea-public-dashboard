# 환경 설정 가이드

## 1. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > 사용자 인증 정보** 이동
4. **OAuth 2.0 클라이언트 ID** 생성
   - 유형: 웹 애플리케이션
   - 승인된 리다이렉션 URI 추가:
     - 개발: `http://localhost:3000/api/auth/callback/google`
     - 프로덕션: `https://korea-public-dashboard.vercel.app/api/auth/callback/google`
5. Client ID와 Client Secret을 복사하여 환경 변수에 설정

> **참고**: Google Workspace 계정(@kookmin.ac.kr 등)은 대학 SAML SSO로 인해 Google OAuth 로그인이 불가할 수 있습니다. 이 경우 이메일 OTP 로그인을 이용하세요.

## 2. Turso DB 설정

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 로그인
turso auth login

# DB 생성
turso db create korea-dashboard

# DB URL 확인
turso db show korea-dashboard --url

# 토큰 생성
turso db tokens create korea-dashboard
```

## 3. 공공데이터포털 API 키

1. [공공데이터포털](https://www.data.go.kr) 회원가입 및 로그인
2. 아래 API 활용 신청:
   - **한국환경공단 에어코리아 대기오염정보** - 시도별 실시간 측정정보 조회
   - **기상청_단기예보 ((구)_동네예보) 조회서비스**
   - **국토교통부_버스노선정보조회서비스**
3. 승인 후 **일반 인증키 (Decoding)** 복사

> 주의: API 키는 URL 인코딩되지 않은 원본 키를 사용해야 합니다.

> 참고: 국토교통부 버스노선 API는 서울 데이터를 제공하지 않습니다. 부산·대구·인천·광주·대전·울산·경기 데이터만 지원됩니다.

## 4. Gmail SMTP 설정 (이메일 OTP 로그인용)

Google Workspace 계정 등 Google OAuth 우회가 필요한 사용자를 위한 이메일 인증코드 발송 설정입니다.

1. [Google 계정 보안](https://myaccount.google.com/security) 접속
2. **2단계 인증** 활성화
3. **앱 비밀번호** 생성 (앱: 메일, 기기: 기타)
4. 생성된 16자리 비밀번호를 `SMTP_PASS`에 설정

## 5. NextAuth SECRET 생성

```bash
openssl rand -base64 32
```

## 6. .env.local 파일 예시

```env
AUTH_SECRET=your_random_secret_here
AUTH_GOOGLE_ID=123456789-xxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxx

TURSO_DATABASE_URL=libsql://korea-dashboard-username.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

DATA_GO_KR_API_KEY=your_decoded_api_key_here

SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

## 7. DB 초기화

```bash
# 의존성 설치
npm install

# DB 테이블 생성 및 초기 사용자 시드
npm run db:seed
```

`src/scripts/seed.ts`의 `usersToSeed` 배열에 허용할 이메일을 추가하세요.

## 8. 나만의 영상 페이지 (로컬 전용)

YouTube 다운로드 기능은 로컬 환경에서만 동작합니다.

- **최초 실행 시** `.ytdlp/yt-dlp.exe`를 GitHub에서 자동 다운로드합니다 (약 20MB).
- `tmp_videos/` 디렉토리에 다운로드된 영상이 저장됩니다.
- AI 모델은 최초 로드 시 브라우저가 HuggingFace Hub에서 약 256MB를 다운로드합니다.
- WebGPU 지원 브라우저(Chrome 113+, Edge 113+) 권장입니다.

> Vercel 배포 환경에서는 YouTube 다운로드가 동작하지 않습니다 (파일시스템·바이너리 제한).

## 9. Vercel 배포 설정

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com) 로그인 후 새 프로젝트 생성
3. GitHub 저장소 연결
4. **Environment Variables** 탭에서 위 환경 변수 모두 추가:
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `DATA_GO_KR_API_KEY`
   - `SMTP_USER`
   - `SMTP_PASS`
5. **Deploy** 클릭

이후 `master` 브랜치 푸시 시 자동 배포됩니다.
