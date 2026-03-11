export interface BusRouteItem {
  routeId: string;
  routeNo: string;
  routeTp: string;
  startNodeNm: string;
  endNodeNm: string;
  startVehicleTime: string;
  endVehicleTime: string;
  peakAlloc: string;
  nPeakAlloc: string;
  cityCode: string;
  cityName: string;
}

export interface BusRouteResponse {
  response: {
    body: {
      items: {
        item: BusRouteItem | BusRouteItem[];
      };
      totalCount: number;
      numOfRows: number;
      pageNo: number;
    };
  };
}

export const CITY_CODE: Record<string, { code: string; name: string }> = {
  서울: { code: "11", name: "서울특별시" },
  부산: { code: "26", name: "부산광역시" },
  대구: { code: "27", name: "대구광역시" },
  인천: { code: "28", name: "인천광역시" },
  광주: { code: "29", name: "광주광역시" },
  대전: { code: "30", name: "대전광역시" },
  울산: { code: "31", name: "울산광역시" },
};
