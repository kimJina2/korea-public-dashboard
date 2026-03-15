import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBoardReplies, createBoardReply, isAdminEmail } from "@/lib/board";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const postId = parseInt(id);
  const isAdmin = session?.user?.email ? isAdminEmail(session.user.email) : false;
  const replies = await getBoardReplies(postId, isAdmin);
  return NextResponse.json(replies);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const postId = parseInt(id);
  const { content, isInternal } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "답변 내용을 입력해주세요." }, { status: 400 });
  }

  const reply = await createBoardReply({
    postId,
    adminEmail: session.user.email,
    adminName: session.user.name ?? null,
    content: content.trim(),
    isInternal: isInternal ?? false,
  });

  return NextResponse.json(reply, { status: 201 });
}
