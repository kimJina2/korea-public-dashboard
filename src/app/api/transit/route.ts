import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { CITY_CODE } from "@/types/transit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cityName = searchParams.get("city") ?? "서울";
  const page = searchParams.get("page") ?? "1";
  const city = CITY_CODE[cityName] ?? CITY_CODE["서울"];

  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_API_KEY!,
    pageNo: page,
    numOfRows: "20",
    _type: "json",
    cityCode: city.code,
  });

  try {
    const res = await fetch(
      `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList?${params}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transit API error:", error);
    return NextResponse.json({ error: "Failed to fetch transit data" }, { status: 500 });
  }
}
