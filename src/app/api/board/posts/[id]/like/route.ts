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
  const result = await toggleLike(parseInt(id), session.user.email);
  return NextResponse.json(result);
}
