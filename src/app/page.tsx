import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { handleSignIn } from "./actions";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: "#f8fafc",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 글로우 효과 */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="w-full max-w-md rounded-2xl border p-6 sm:p-10"
        style={{
          background: "#ffffff",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: "rgba(0,0,0,0.08)",
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
              }}
            >
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <h1
            className="text-3xl font-bold"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            공공데이터 대시보드
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
            한국 공공 데이터 기반 실시간 정보 서비스
          </p>
        </div>

        <div
          className="mb-6 rounded-xl p-4"
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#6366f1" }}>
            제공 정보
          </p>
          <ul className="mt-2 space-y-1 text-sm" style={{ color: "#475569" }}>
            <li>🌫️ 전국 대기질 (PM10, PM2.5, AQI)</li>
            <li>🌤️ 지역별 날씨 예보</li>
            <li>🚌 시내버스 노선 정보</li>
          </ul>
        </div>

        <form action={handleSignIn}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 whitespace-nowrap"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google 계정으로 로그인
          </button>
        </form>

        <p className="mt-4 text-center text-xs" style={{ color: "#94a3b8" }}>
          허가된 계정만 접근할 수 있습니다
        </p>
      </div>
    </div>
  );
}
