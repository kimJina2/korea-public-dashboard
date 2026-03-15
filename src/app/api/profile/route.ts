import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProfile, upsertProfile, isNicknameTaken } from "@/lib/user-profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const profile = await getProfile(session.user.email);
  return NextResponse.json(profile ?? null);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const email = session.user.email;
  const { nickname, bio, profileImage, language } = await req.json();

  if (nickname !== undefined && nickname !== null) {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ error: "닉네임은 2자 이상이어야 합니다." }, { status: 400 });
    }
    if (trimmed.length > 20) {
      return NextResponse.json({ error: "닉네임은 20자 이하여야 합니다." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9가-힣_\-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "닉네임은 한글, 영문, 숫자, _, - 만 사용 가능합니다." },
        { status: 400 }
      );
    }
    const taken = await isNicknameTaken(trimmed, email);
    if (taken) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다." }, { status: 409 });
    }
  }

  const updated = await upsertProfile(email, {
    nickname: nickname?.trim() ?? undefined,
    bio: bio !== undefined ? bio : undefined,
    profileImage: profileImage !== undefined ? profileImage : undefined,
    language: language ?? undefined,
  });

  return NextResponse.json(updated);
}
