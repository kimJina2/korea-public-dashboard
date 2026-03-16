import { NextRequest, NextResponse } from "next/server";
import { CITY_GRID } from "@/types/weather";

function getBaseDateTime() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hours = kst.getUTCHours();

  // 기상청 API 발표 시각: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = baseTimes[0];
  for (const t of baseTimes) {
    if (hours >= t) baseHour = t;
  }

  const baseDate = kst.toISOString().slice(0, 10).replace(/-/g, "");
  const baseTime = String(baseHour).padStart(2, "0") + "00";
  return { baseDate, baseTime };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityName = searchParams.get("city") ?? "서울";
  const city = CITY_GRID[cityName] ?? CITY_GRID["서울"];
  const { baseDate, baseTime } = getBaseDateTime();

  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_API_KEY!,
    pageNo: "1",
    numOfRows: "200",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(city.nx),
    ny: String(city.ny),
  });

  try {
    const res = await fetch(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${params}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 });
  }
}
