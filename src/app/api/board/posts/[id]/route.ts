import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { posts, postLikes, comments, boardReplies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail, updatePostStatus, updatePostContent } from "@/lib/board";

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
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  const postId = parseInt(id, 10);

  const body = await req.json();

  // 작성자 본인: 제목/내용/URL 수정
  if (body._action === "edit") {
    const { title, content, serviceUrl } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "서비스 소개를 입력해주세요." }, { status: 400 });
    }
    if (!serviceUrl?.trim()) {
      return NextResponse.json({ error: "서비스 URL을 입력해주세요." }, { status: 400 });
    }
    try { new URL(serviceUrl.trim()); } catch {
      return NextResponse.json({ error: "올바른 URL 형식을 입력해주세요." }, { status: 400 });
    }

    try {
      await updatePostContent(postId, session.user.email, {
        title: title.trim(),
        content: content.trim(),
        serviceUrl: serviceUrl.trim(),
      });
      return NextResponse.json({ success: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "Forbidden") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      if (msg === "Post not found") return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
      return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
    }
  }

  // 관리자: 상태 변경
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

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
