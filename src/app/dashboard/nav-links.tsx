"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";

export function NavDropdown() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const dashboardPaths = ["/dashboard/air-quality", "/dashboard/weather", "/dashboard/transit", "/dashboard/subway"];
  const isActive =
    pathname === "/dashboard" || dashboardPaths.some((p) => pathname.startsWith(p));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
        style={{
          color: isActive ? "#6366f1" : "#64748b",
          background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
        }}
      >
        {t.dashboard}
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div
            className="rounded-xl py-2 min-w-36"
            style={{
              background: "rgba(255,255,255,0.98)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <DropdownItem href="/dashboard/air-quality">🌫️ {t.airQuality}</DropdownItem>
            <DropdownItem href="/dashboard/weather">🌤️ {t.weather}</DropdownItem>
            <DropdownItem href="/dashboard/transit">🚌 {t.transit}</DropdownItem>
            <DropdownItem href="/dashboard/subway">🚇 {t.subway}</DropdownItem>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
      style={{
        color: isActive ? "#6366f1" : "#475569",
        background: isActive ? "rgba(99,102,241,0.06)" : "transparent",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(99,102,241,0.08)";
        el.style.color = "#6366f1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = isActive ? "rgba(99,102,241,0.06)" : "transparent";
        el.style.color = isActive ? "#6366f1" : "#475569";
      }}
    >
      {children}
    </Link>
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap"
      style={{
        color: isActive ? "#6366f1" : "#64748b",
        background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "rgba(99,102,241,0.08)";
        el.style.color = "#6366f1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = isActive ? "rgba(99,102,241,0.08)" : "transparent";
        el.style.color = isActive ? "#6366f1" : "#64748b";
      }}
    >
      {children}
    </Link>
  );
}

// 게시판 네비게이션 링크 (번역 포함)
export function BoardNavLink() {
  const { t } = useLanguage();
  return <NavLink href="/dashboard/board">📋 {t.board}</NavLink>;
}

// 나만의영상 네비게이션 링크
export function VideosNavLink() {
  const { t } = useLanguage();
  return <NavLink href="/dashboard/videos">🎬 {t.myVideos}</NavLink>;
}

// 하단 탭 아이템
function BottomNavLink({ href, emoji, labelKey }: { href: string; emoji: string; labelKey: keyof ReturnType<typeof useLanguage>["t"] }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-3 py-2 transition-all duration-200 whitespace-nowrap"
      style={{ color: isActive ? "#6366f1" : "#94a3b8" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6366f1"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = isActive ? "#6366f1" : "#94a3b8"; }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-xs font-medium">{t[labelKey] as string}</span>
    </Link>
  );
}

// 하단 탭 바 (layout에서 사용)
export function BottomNavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 -1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex h-16 items-center justify-around">
        <BottomNavLink href="/dashboard" emoji="🏠" labelKey="home" />
        <BottomNavLink href="/dashboard/air-quality" emoji="📊" labelKey="todayInfo" />
        <BottomNavLink href="/dashboard/subway" emoji="🚇" labelKey="subway" />
        <BottomNavLink href="/dashboard/videos" emoji="🎬" labelKey="myVideos" />
        <BottomNavLink href="/dashboard/board" emoji="📋" labelKey="board" />
      </div>
    </nav>
  );
}
