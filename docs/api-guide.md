# API 연동 가이드

## 내부 API 엔드포인트

모든 API 엔드포인트는 인증된 세션이 필요합니다. 미인증 요청은 401을 반환합니다.

---

### POST /api/auth/send-otp

이메일 OTP 인증코드를 발송합니다.

**요청 바디**
```json
{ "email": "user@example.com" }
```

**응답**
- `200 OK`: 발송 성공
- `403 Forbidden`: 허용되지 않은 이메일
- `500 Internal Server Error`: 발송 실패

---

### GET /api/air-quality

시도별 실시간 대기질 측정 정보를 반환합니다.

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| city | string | 서울 | 시도명 (서울, 부산, 대구, 인천, 광주, 대전, 울산, 경기, 강원 등) |

**응답 예시**
```json
{
  "response": {
    "body": {
      "items": [
        {
          "stationName": "중구",
          "sidoName": "서울",
          "dataTime": "2024-01-01 12:00",
          "pm10Value": "32",
          "pm25Value": "18",
          "pm10Grade": "2",
          "pm25Grade": "2",
          "khaiValue": "75",
          "khaiGrade": "2"
        }
      ],
      "totalCount": 25
    }
  }
}
```

---

### GET /api/weather

기상청 단기예보 데이터를 반환합니다.

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| city | string | 서울 | 도시명 (서울, 부산, 대구, 인천, 광주, 대전, 울산, 제주) |

**날씨 카테고리 코드**
| category | 설명 |
|---------|------|
| TMP | 기온 (°C) |
| SKY | 하늘상태 (1:맑음, 3:구름많음, 4:흐림) |
| PTY | 강수형태 (0:없음, 1:비, 2:비/눈, 3:눈, 4:소나기) |
| POP | 강수확률 (%) |
| REH | 습도 (%) |
| WSD | 풍속 (m/s) |

---

### GET /api/transit

시내버스 노선 정보를 반환합니다.

> 서울은 국토교통부 버스노선 API에서 지원되지 않습니다. 부산·대구·인천·광주·대전·울산·경기를 선택하세요.

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| city | string | 부산 | 도시명 |
| page | number | 1 | 페이지 번호 (20개씩) |

**도시 코드 매핑**
| 도시 | cityCode |
|------|---------|
| 부산 | 21 |
| 대구 | 22 |
| 인천 | 23 |
| 광주 | 24 |
| 대전 | 25 |
| 울산 | 26 |
| 경기 | 31 |

---

### POST /api/youtube/download

YouTube URL로 영상을 서버에 다운로드합니다.

> 로컬 개발 전용 기능입니다. Vercel 배포 환경에서는 동작하지 않습니다 (파일시스템·바이너리 제한).

**요청 바디**
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

**응답**
```json
{
  "id": "f4b8a3ab-5db0-4702-915c-...",
  "filename": "f4b8a3ab-5db0-4702-915c-....mp4",
  "title": "영상 제목",
  "videoUrl": "/api/youtube/video/f4b8a3ab-5db0-4702-915c-....mp4"
}
```

**동작 방식**
1. `.ytdlp/yt-dlp.exe` 바이너리 존재 여부 확인 (없으면 GitHub에서 자동 다운로드)
2. `best[ext=mp4]` 단일 스트림 포맷으로 다운로드 (ffmpeg 불필요)
3. `tmp_videos/{uuid}.mp4`에 저장

**오류 응답**
- `400 Bad Request`: 유효하지 않은 YouTube URL
- `401 Unauthorized`: 미인증 요청
- `500 Internal Server Error`: 다운로드 실패 (메시지 포함)

---

### GET /api/youtube/video/[filename]

다운로드된 영상을 HTTP Range 스트리밍으로 제공합니다.

**경로 파라미터**
| 파라미터 | 설명 |
|---------|------|
| filename | `{uuid}.mp4` 형식 파일명 |

**특징**
- `Range` 헤더 지원 → 브라우저 `<video>` seek 가능
- 경로 순회 공격 방지 (`..` 포함 시 400 반환)
- 파일 미존재 시 404 반환

---

### GET /api/profile

현재 로그인 사용자의 프로필을 반환합니다.

**응답**
```json
{
  "email": "user@example.com",
  "display_name": "홍길동",
  "avatar_url": "https://...",
  "language": "ko"
}
```

---

### PATCH /api/profile

프로필 정보를 업데이트합니다.

**요청 바디** (부분 업데이트 가능)
```json
{
  "display_name": "새이름",
  "language": "en"
}
```

---

### GET /api/board/posts

게시글 목록을 반환합니다. (페이지네이션)

### POST /api/board/posts

새 게시글을 작성합니다.

### GET /api/board/posts/[id]

특정 게시글과 댓글 목록을 반환합니다.

### POST /api/board/comments

댓글을 작성합니다.

### POST /api/board/reactions

댓글에 이모지 반응을 추가합니다.

---

## 외부 API 정보

### 한국환경공단 에어코리아

- **엔드포인트**: `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty`
- **캐시**: 5분

### 기상청 단기예보

- **엔드포인트**: `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
- **발표 시각**: 02, 05, 08, 11, 14, 17, 20, 23시
- **캐시**: 1시간

### 국토교통부 버스노선정보

- **엔드포인트**: `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList`
- **캐시**: 1시간
- **참고**: HTTP가 아닌 HTTPS 엔드포인트 사용 필수
