import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavDropdown, BoardNavLink, VideosNavLink, BottomNavBar } from "./nav-links";
import { ProfileButton } from "./profile-button";
import { LanguageSwitcher } from "./language-switcher";
import { LanguageProvider } from "@/contexts/language-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    redirect("/");
  }
  if (!session) redirect("/");

  return (
    <LanguageProvider>
      <div className="min-h-screen" style={{ background: "#f8fafc" }}>
        <nav
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          className="sticky top-0 z-50"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
                    }}
                  >
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    JINA
                  </span>
                </Link>
                {/* 데스크탑/태블릿 상단 네비게이션 */}
                <div className="hidden items-center gap-1 sm:flex">
                  <NavDropdown />
                  <VideosNavLink />
                  <BoardNavLink />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ProfileButton
                  email={session.user?.email ?? ""}
                  name={session.user?.name ?? null}
                  googleImage={session.user?.image ?? null}
                />
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
          {children}
        </main>

        {/* 모바일 하단 탭 네비게이션 */}
        <BottomNavBar />
      </div>
    </LanguageProvider>
  );
}
