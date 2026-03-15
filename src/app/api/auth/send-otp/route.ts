import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/lib/allowed-users";
import { createAndSendOtp } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // IP-based rate limit: 10 per 15 min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipLimit = checkRateLimit(`otp-ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 400 });
    }

    // Email-based rate limit: 3 per 15 min
    const emailLimit = checkRateLimit(`otp-email:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "해당 이메일로 너무 많은 인증코드를 요청했습니다. 15분 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
      );
    }

    const allowed = await isEmailAllowed(normalizedEmail);
    if (!allowed) {
      return NextResponse.json({ error: "접근 권한이 없는 이메일입니다." }, { status: 403 });
    }

    await createAndSendOtp(normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("OTP 전송 오류:", e);
    return NextResponse.json({ error: "인증코드 전송에 실패했습니다." }, { status: 500 });
  }
}
