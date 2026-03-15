"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LANG_NAMES, LANG_FLAGS, type Lang } from "@/lib/i18n";

const LANGS = Object.keys(LANG_NAMES) as Lang[];

export function LanguageSwitcher() {
  const { lang, changeLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all duration-200"
        style={{ color: "#475569" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
        title={t.language}
      >
        <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
        <span className="hidden md:block">{LANG_NAMES[lang]}</span>
        <svg
          className="w-3 h-3 hidden md:block flex-shrink-0 transition-transform duration-200"
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
          className="absolute right-0 top-full mt-2 z-50 rounded-2xl py-1.5 min-w-[140px]"
          style={{
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { changeLanguage(l); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150"
              style={{
                color: l === lang ? "#6366f1" : "#475569",
                background: l === lang ? "rgba(99,102,241,0.06)" : "transparent",
                fontWeight: l === lang ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (l !== lang) e.currentTarget.style.background = "rgba(99,102,241,0.05)";
              }}
              onMouseLeave={(e) => {
                if (l !== lang) e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="text-base leading-none">{LANG_FLAGS[l]}</span>
              <span>{LANG_NAMES[l]}</span>
              {l === lang && (
                <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
