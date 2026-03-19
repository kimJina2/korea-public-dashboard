import { NextResponse } from "next/server";
import { SUBWAY_LINES } from "@/app/dashboard/subway/station-data";

const BASE = "http://swopenapi.seoul.go.kr/api/subway";

// subwayId → 호선명 맵 (station-data에서 파생)
const LINE_NAME = Object.fromEntries(SUBWAY_LINES.map((l) => [l.id, l.name]));

interface SubwayApiTrain {
  trainNo: string;
  statnNm: string;
  updnLine: string;
  trainSttus: string;
  endstatnNm?: string;
  statnTnm?: string;
  directAt: string;
  lstcarAt: string;
  recptnDt: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get("lineId") ?? "1002";

  const key = process.env.SEOUL_SUBWAY_API_KEY;
  if (!key) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const lineName = LINE_NAME[lineId];
  if (!lineName) return NextResponse.json({ error: "지원하지 않는 호선입니다" }, { status: 400 });

  const url = `${BASE}/${key}/json/realtimePosition/0/200/${encodeURIComponent(lineName)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    const data = await res.json();

    if (data.errorMessage?.code !== "INFO-000") {
      return NextResponse.json({ error: data.errorMessage?.message ?? "API 오류" }, { status: 500 });
    }

    const trains = (data.realtimePositionList ?? []).map((t: SubwayApiTrain) => ({
      trainNo: t.trainNo,
      statnNm: t.statnNm,
      updnLine: t.updnLine,     // "0"=상행/외선, "1"=하행/내선
      trainSttus: t.trainSttus, // 0=운행중,1=진입,2=도착,3=출발,4=전역출발,5=급행통과
      endstatnNm: t.endstatnNm ?? t.statnTnm ?? "",
      directAt: t.directAt,
      lstcarAt: t.lstcarAt,
      recptnDt: t.recptnDt,
    }));

    return NextResponse.json({ trains, total: trains.length });
  } catch (e) {
    console.error("subway API error:", e);
    return NextResponse.json({ error: "데이터를 불러오지 못했습니다" }, { status: 500 });
  }
}
