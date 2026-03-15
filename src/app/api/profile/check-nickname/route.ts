import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isNicknameTaken } from "@/lib/user-profile";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const nickname = searchParams.get("q")?.trim() ?? "";

  if (!nickname) {
    return NextResponse.json({ available: false, message: "닉네임을 입력해주세요." });
  }
  if (nickname.length < 2) {
    return NextResponse.json({ available: false, message: "2자 이상 입력해주세요." });
  }
  if (nickname.length > 20) {
    return NextResponse.json({ available: false, message: "20자 이하로 입력해주세요." });
  }
  if (!/^[a-zA-Z0-9가-힣_\-]+$/.test(nickname)) {
    return NextResponse.json({
      available: false,
      message: "한글, 영문, 숫자, _, - 만 사용 가능합니다.",
    });
  }

  const taken = await isNicknameTaken(nickname, session.user.email);
  return NextResponse.json({
    available: !taken,
    message: taken ? "이미 사용 중인 닉네임입니다." : "사용 가능한 닉네임입니다.",
  });
}
