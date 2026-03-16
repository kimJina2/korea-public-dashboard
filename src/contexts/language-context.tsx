"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Lang, type Translations, translations, getT } from "@/lib/i18n";

type LanguageContextType = {
  lang: Lang;
  t: Translations;
  changeLanguage: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ko",
  t: translations.ko as unknown as Translations,
  changeLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with "ko" on both server and client to prevent hydration mismatch.
  // The saved language is applied after hydration in the effect below.
  const [lang, setLang] = useState<Lang>("ko");

  useEffect(() => {
    // NextAuth 세션 확인 (비로그인 시 401 없이 200으로 {} 반환)
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (!session?.user) {
          // 비로그인 상태 → localStorage 초기화 후 한국어 고정
          localStorage.removeItem("jina_lang");
          setLang("ko");
          return;
        }
        // 로그인 상태 → 프로필에서 언어 설정 로드
        return fetch("/api/profile")
          .then((r) => r.json())
          .then((data) => {
            if (data?.language && data.language in translations) {
              setLang(data.language as Lang);
              localStorage.setItem("jina_lang", data.language);
            } else {
              const saved = localStorage.getItem("jina_lang");
              if (saved && saved in translations) {
                setLang(saved as Lang);
              }
            }
          });
      })
      .catch(() => {
        const saved = localStorage.getItem("jina_lang");
        if (saved && saved in translations) {
          setLang(saved as Lang);
        }
      });
  }, []);

  const changeLanguage = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("jina_lang", newLang);
    // 프로필에 저장 (비동기, 실패해도 무시)
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    }).catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: getT(lang), changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
