import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/schema";
import { getComments, isAdminEmail } from "@/lib/board";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const data = await getComments(parseInt(id), session?.user?.email ?? undefined);
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { content, parentId } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }

  const email = session.user.email;
  const [comment] = await db
    .insert(comments)
    .values({
      postId: parseInt(id),
      parentId: parentId ?? null,
      authorEmail: email,
      authorName: session.user.name ?? null,
      authorImage: session.user.image ?? null,
      content: content.trim(),
      isAdminFeedback: isAdminEmail(email),
    })
    .returning();

  return NextResponse.json(comment, { status: 201 });
}
