import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPosts, createPost } from "@/lib/board";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    const data = await getPosts(session?.user?.email ?? undefined);
    return NextResponse.json(data);
  } catch (e) {
    console.error("게시글 조회 오류:", e);
    return NextResponse.json({ error: "게시글을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { title, content, serviceUrl, boardType, visibility } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: "제목은 200자 이하로 입력해주세요." }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "서비스 소개를 입력해주세요." }, { status: 400 });
    }

    if (content.trim().length > 10000) {
      return NextResponse.json({ error: "내용은 10000자 이하로 입력해주세요." }, { status: 400 });
    }

    if (!serviceUrl?.trim()) {
      return NextResponse.json({ error: "서비스 URL을 입력해주세요." }, { status: 400 });
    }

    try {
      new URL(serviceUrl.trim());
    } catch {
      return NextResponse.json({ error: "올바른 URL 형식을 입력해주세요. (예: https://example.com)" }, { status: 400 });
    }

    const VALID_BOARD_TYPES = ["normal", "inquiry", "report"];
    const VALID_VISIBILITY = ["public", "private"];
    const validBoardType = VALID_BOARD_TYPES.includes(boardType) ? boardType : "normal";
    const validVisibility = VALID_VISIBILITY.includes(visibility ?? "public")
      ? visibility
      : "public";

    // Fetch custom profile name/image (fail gracefully if table missing columns)
    let profile: typeof userProfiles.$inferSelect | undefined;
    try {
      [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.email, session.user.email))
        .limit(1);
    } catch {
      profile = undefined;
    }

    const post = await createPost({
      authorEmail: session.user.email,
      authorName: profile?.nickname ?? session.user.name ?? null,
      authorImage: profile?.profileImage ?? session.user.image ?? null,
      title: title.trim(),
      content: content.trim(),
      serviceUrl: serviceUrl.trim(),
      boardType: validBoardType,
      visibility: validVisibility,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    console.error("게시글 작성 오류:", e);
    return NextResponse.json({ error: "게시글 작성에 실패했습니다." }, { status: 500 });
  }
}
