import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "서울";

  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_API_KEY!,
    returnType: "json",
    numOfRows: "20",
    pageNo: "1",
    sidoName: city,
    ver: "1.0",
  });

  try {
    const res = await fetch(
      `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Air quality API error:", error);
    return NextResponse.json({ error: "Failed to fetch air quality data" }, { status: 500 });
  }
}
