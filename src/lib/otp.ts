import { db } from "./db";
import { emailOtps } from "./schema";
import { and, eq, gt } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(email: string): Promise<void> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분

  await db.insert(emailOtps).values({ email, otp: code, expiresAt });

  await resend.emails.send({
    from: "공공데이터 대시보드 <onboarding@resend.dev>",
    to: email,
    subject: "[공공데이터 대시보드] 로그인 인증코드",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">로그인 인증코드</h2>
        <p style="color: #64748b; margin-bottom: 24px;">아래 6자리 코드를 입력해 로그인하세요. 10분 후 만료됩니다.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
      </div>
    `,
  });
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const now = new Date().toISOString();

  const rows = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, email),
        eq(emailOtps.otp, otp),
        eq(emailOtps.used, false),
        gt(emailOtps.expiresAt, now)
      )
    )
    .limit(1);

  if (rows.length === 0) return false;

  await db
    .update(emailOtps)
    .set({ used: true })
    .where(eq(emailOtps.id, rows[0].id));

  return true;
}
