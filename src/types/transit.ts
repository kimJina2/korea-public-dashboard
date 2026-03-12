export interface BusRouteItem {
  routeid: string;
  routeno: string | number;
  routetp: string;
  startnodenm: string;
  endnodenm: string;
  startvehicletime: string | number;
  endvehicletime: string | number;
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
  부산: { code: "21", name: "부산광역시" },
  대구: { code: "22", name: "대구광역시" },
  인천: { code: "23", name: "인천광역시" },
  광주: { code: "24", name: "광주광역시" },
  대전: { code: "25", name: "대전광역시" },
  울산: { code: "26", name: "울산광역시" },
  경기: { code: "31", name: "경기도" },
};
