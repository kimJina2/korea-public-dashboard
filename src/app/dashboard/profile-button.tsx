"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { handleSignOut } from "@/app/actions";
import { useLanguage } from "@/contexts/language-context";

function Avatar({
  name,
  email,
  image,
  size = 32,
}: {
  name: string | null;
  email: string;
  image: string | null;
  size?: number;
}) {
  const initials = name ? name.slice(0, 2) : email.slice(0, 2).toUpperCase();
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? email}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
      }}
    >
      {initials}
    </div>
  );
}

export function ProfileButton({
  email,
  name,
  googleImage,
}: {
  email: string;
  name: string | null;
  googleImage: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profileImage) setProfileImage(data.profileImage);
        if (data?.nickname) setNickname(data.nickname);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      setProfileImage(detail.profileImage ?? null);
      if (detail.nickname !== undefined) setNickname(detail.nickname);
    }
    window.addEventListener("profile-image-updated", handleUpdate);
    return () => window.removeEventListener("profile-image-updated", handleUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayImage = profileImage ?? googleImage;
  const displayName = nickname ?? name ?? email.split("@")[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200"
        style={{ color: "#475569" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(99,102,241,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <Avatar name={displayName} email={email} image={displayImage} size={32} />
        <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
          {displayName}
        </span>
        <svg
          className="w-3.5 h-3.5 hidden sm:block transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl py-2"
          style={{
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          {/* 유저 정보 */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar name={displayName} email={email} image={displayImage} size={44} />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "#1e293b" }}>
                {displayName}
              </p>
              <p className="text-xs truncate" style={{ color: "#94a3b8" }}>
                {email}
              </p>
            </div>
          </div>

          <div className="mx-3 my-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />

          {/* 프로필 설정 */}
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.07)";
              e.currentTarget.style.color = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <span className="text-base">⚙️</span>
            <span className="font-medium">{t.profileSettings}</span>
          </Link>

          <div className="mx-3 my-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />

          {/* 로그아웃 */}
          <form action={handleSignOut} className="mx-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              <span className="text-base">🚪</span>
              <span className="font-medium">{t.logout}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
