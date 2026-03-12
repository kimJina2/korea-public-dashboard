import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginPage } from "./login-page";

export default async function Home() {
  try {
    const session = await auth();
    if (session) redirect("/dashboard");
  } catch {
    // 만료되거나 잘못된 세션 쿠키는 무시하고 로그인 페이지 표시
  }

  return <LoginPage />;
}
