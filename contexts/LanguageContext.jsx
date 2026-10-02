"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dict } from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("ay-lang");
    if (saved === "ar" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("ay-lang", lang);
  }, [lang]);

  const t = (key) => dict[lang]?.[key] ?? key;
  const toggle = () => setLang((l) => (l === "en" ? "ar" : "en"));
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
