import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toggleLike } from "@/lib/board";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  const result = await toggleLike(parseInt(id, 10), session.user.email);
  return NextResponse.json(result);
}
