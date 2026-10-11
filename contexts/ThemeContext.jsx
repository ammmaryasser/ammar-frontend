"use client";

import { createContext, useContext, useEffect } from "react";

import {usePreference} from "@/lib/preferences";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = usePreference("ay-theme", "light", ["light", "dark"]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setTheme(theme === "light" ? "dark" : "light");
  const set = (v) => setTheme(v === "dark" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, set, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
