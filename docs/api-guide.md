# API 연동 가이드

## 내부 API 엔드포인트

모든 API 엔드포인트는 인증된 세션이 필요합니다. 미인증 요청은 401을 반환합니다.

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

**응답 예시**
```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "baseDate": "20240101",
            "baseTime": "0800",
            "category": "TMP",
            "fcstDate": "20240101",
            "fcstTime": "1200",
            "fcstValue": "5"
          }
        ]
      }
    }
  }
}
```

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

**쿼리 파라미터**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| city | string | 서울 | 도시명 (서울, 부산, 대구, 인천, 광주, 대전, 울산) |
| page | number | 1 | 페이지 번호 (20개씩) |

**응답 예시**
```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "routeId": "100100118",
            "routeNo": "100",
            "routeTp": "11",
            "startNodeNm": "개화역",
            "endNodeNm": "신촌오거리",
            "startVehicleTime": "04:30",
            "endVehicleTime": "23:00",
            "peakAlloc": "7",
            "nPeakAlloc": "10"
          }
        ]
      },
      "totalCount": 374,
      "numOfRows": 20,
      "pageNo": 1
    }
  }
}
```

## 외부 API 정보

### 한국환경공단 에어코리아

- **엔드포인트**: `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty`
- **캐시**: 5분

### 기상청 단기예보

- **엔드포인트**: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
- **발표 시각**: 02, 05, 08, 11, 14, 17, 20, 23시
- **캐시**: 1시간

### 국토교통부 버스노선정보

- **엔드포인트**: `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList`
- **캐시**: 1시간
