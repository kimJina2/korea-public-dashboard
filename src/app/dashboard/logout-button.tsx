"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
    >
      로그아웃
    </button>
  );
}
