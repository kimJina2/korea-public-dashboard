"use client";

import { handleSignOut } from "@/app/actions";

export function LogoutButton() {
  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
        style={{
          background: "#ffffff",
          borderColor: "rgba(0,0,0,0.12)",
          color: "#475569",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "rgba(239,68,68,0.06)";
          el.style.borderColor = "rgba(239,68,68,0.3)";
          el.style.color = "#dc2626";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "#ffffff";
          el.style.borderColor = "rgba(0,0,0,0.12)";
          el.style.color = "#475569";
        }}
      >
        로그아웃
      </button>
    </form>
  );
}
