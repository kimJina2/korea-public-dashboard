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
    // 1. localStorage에서 즉시 적용
    const saved = localStorage.getItem("jina_lang");
    if (saved && saved in translations) {
      setLang(saved as Lang);
    }

    // 2. 프로필 API에서 서버 저장 값 로드 (우선순위 높음)
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.language && data.language in translations) {
          setLang(data.language as Lang);
          localStorage.setItem("jina_lang", data.language);
        }
      })
      .catch(() => {});
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
