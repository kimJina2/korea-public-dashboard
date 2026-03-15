import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isEmailAllowed, registerUser } from "@/lib/allowed-users";
import { verifyOtp } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      id: "email-otp",
      credentials: {
        email: { label: "이메일", type: "email" },
        otp: { label: "인증코드", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const otp = credentials?.otp as string;
        if (!email || !otp) return null;

        const allowed = await isEmailAllowed(email);
        if (!allowed) return null;

        const valid = await verifyOtp(email, otp);
        if (!valid) return null;

        return { id: email, email };
      },
    }),
  ],
  session: {
    maxAge: 20 * 60, // 20분
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Google OAuth: 신규 사용자 자동 회원가입
      if (account?.provider === "google") {
        try {
          await registerUser(user.email, user.name ?? undefined);
          return true;
        } catch (error) {
          console.error("Google 회원가입 오류:", error);
          return false;
        }
      }

      // 이메일 OTP: 기존 등록된 사용자만 허용
      try {
        return await isEmailAllowed(user.email);
      } catch (error) {
        console.error("이메일 허용 여부 확인 오류:", error);
        return false;
      }
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
