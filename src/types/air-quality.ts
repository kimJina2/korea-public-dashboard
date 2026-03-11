export interface AirQualityItem {
  stationName: string;
  sidoName: string;
  dataTime: string;
  pm10Value: string;
  pm25Value: string;
  pm10Grade: string;
  pm25Grade: string;
  o3Value: string;
  no2Value: string;
  coValue: string;
  so2Value: string;
  khaiValue: string;
  khaiGrade: string;
}

export interface AirQualityResponse {
  response: {
    body: {
      items: AirQualityItem[];
      totalCount: number;
    };
  };
}
