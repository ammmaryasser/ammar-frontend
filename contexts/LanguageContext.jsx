"use client";

import { createContext, useContext, useEffect } from "react";
import { dict } from "@/lib/i18n";

import {usePreference} from "@/lib/preferences";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = usePreference("ay-lang", "en", ["en", "ar"]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = (key) => dict[lang]?.[key] ?? key;
  const toggle = () => setLang(lang === "en" ? "ar" : "en");
  const set = (v) => setLang(v === "ar" ? "ar" : "en");
  const isAr = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, isAr, t, toggle, set }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
