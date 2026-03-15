import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "./landing-page";

export default async function Home() {
  try {
    const session = await auth();
    if (session) redirect("/dashboard");
  } catch {
    // 만료되거나 잘못된 세션 쿠키는 무시하고 랜딩 페이지 표시
  }

  return <LandingPage />;
}
