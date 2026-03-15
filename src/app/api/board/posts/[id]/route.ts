import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { posts, postLikes, comments, boardReplies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail, updatePostStatus } from "@/lib/board";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  const postId = parseInt(id, 10);

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (post.authorEmail !== session.user.email && !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await db.delete(postLikes).where(eq(postLikes.postId, postId));
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(boardReplies).where(eq(boardReplies.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  const postId = parseInt(id, 10);

  const body = await req.json();

  const VALID_VALUES = {
    processStatus: ["received", "in_review", "resolved", "closed"],
    answerStatus: ["none", "pending", "answered"],
    visibility: ["public", "private", "admin_only"],
  } as const;

  const allowed = ["processStatus", "answerStatus", "visibility"] as const;
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const val = String(body[key]);
      if (!(VALID_VALUES[key] as readonly string[]).includes(val)) {
        return NextResponse.json({ error: `유효하지 않은 ${key} 값입니다.` }, { status: 400 });
      }
      updates[key] = val;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  await updatePostStatus(postId, session.user.email, updates);
  return NextResponse.json({ success: true });
}
