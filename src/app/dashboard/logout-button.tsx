"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
      style={{
        background: "rgba(255,255,255,0.1)",
        borderColor: "rgba(255,255,255,0.2)",
        color: "#f1f5f9",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = "rgba(239,68,68,0.2)";
        el.style.borderColor = "rgba(239,68,68,0.5)";
        el.style.color = "#f87171";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "rgba(255,255,255,0.1)";
        el.style.borderColor = "rgba(255,255,255,0.2)";
        el.style.color = "#f1f5f9";
      }}
    >
      로그아웃
    </button>
  );
}
