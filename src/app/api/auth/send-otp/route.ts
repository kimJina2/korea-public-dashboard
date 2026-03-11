import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/lib/allowed-users";
import { createAndSendOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    const allowed = await isEmailAllowed(email.trim().toLowerCase());
    if (!allowed) {
      return NextResponse.json({ error: "접근 권한이 없는 이메일입니다." }, { status: 403 });
    }

    await createAndSendOtp(email.trim().toLowerCase());

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("OTP 전송 오류:", e);
    return NextResponse.json({ error: "인증코드 전송에 실패했습니다." }, { status: 500 });
  }
}
