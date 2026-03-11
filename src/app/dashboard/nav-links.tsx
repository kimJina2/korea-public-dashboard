"use client";

import Link from "next/link";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
      style={{ color: "#64748b" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(99,102,241,0.08)";
        el.style.color = "#6366f1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "transparent";
        el.style.color = "#64748b";
      }}
    >
      {children}
    </Link>
  );
}

export function BottomNavLink({
  href,
  emoji,
  label,
}: {
  href: string;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 whitespace-nowrap"
      style={{ color: "#94a3b8" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#6366f1";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
      }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
