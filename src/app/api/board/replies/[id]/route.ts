import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteBoardReply } from "@/lib/board";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const replyId = parseInt(id);

  try {
    await deleteBoardReply(replyId, session.user.email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
}
