import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reactToComment } from "@/lib/board";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  const { type } = await req.json();

  if (type !== "like" && type !== "dislike") {
    return NextResponse.json({ error: "type must be 'like' or 'dislike'" }, { status: 400 });
  }

  try {
    const result = await reactToComment(parseInt(id, 10), session.user.email, type);
    return NextResponse.json(result);
  } catch (e) {
    console.error("댓글 반응 오류:", e);
    return NextResponse.json({ error: "반응 처리에 실패했습니다." }, { status: 500 });
  }
}
