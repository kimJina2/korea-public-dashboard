export interface WeatherItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export interface WeatherResponse {
  response: {
    body: {
      items: {
        item: WeatherItem[];
      };
      totalCount: number;
    };
  };
}

export interface ProcessedWeather {
  date: string;
  time: string;
  temp: string;
  sky: string;
  pty: string;
  pop: string;
  humidity: string;
  windSpeed: string;
}

export const SKY_CODE: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

export const PTY_CODE: Record<string, string> = {
  "0": "없음",
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "4": "소나기",
};

export const CITY_GRID: Record<string, { nx: number; ny: number; name: string }> = {
  서울: { nx: 60, ny: 127, name: "서울" },
  부산: { nx: 98, ny: 76, name: "부산" },
  대구: { nx: 89, ny: 90, name: "대구" },
  인천: { nx: 55, ny: 124, name: "인천" },
  광주: { nx: 58, ny: 74, name: "광주" },
  대전: { nx: 67, ny: 100, name: "대전" },
  울산: { nx: 102, ny: 84, name: "울산" },
  제주: { nx: 52, ny: 38, name: "제주" },
};
