import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isEmailAllowed } from "@/lib/allowed-users";
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
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        return await isEmailAllowed(user.email);
      } catch (error) {
        console.error("Error checking email allowance:", error);
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
