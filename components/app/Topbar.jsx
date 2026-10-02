"use client";

import { useRouter } from "next/navigation";
import { Search, Sun, Moon, Languages, ShoppingCart } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Topbar() {
  const { t, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 md:px-8 bg-surface border-b border-line">
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <Search
          size={16}
          strokeWidth={1.8}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="w-full h-9 ps-9 pe-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex-1" />

      {/* New Sale — icon-only on phones */}
      <button
        onClick={() => router.push("/sales?new=1")}
        aria-label={t("newSale")}
        className="flex items-center gap-2 h-9 px-3 sm:px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <ShoppingCart size={15} strokeWidth={2} />
        <span className="hidden sm:inline">{t("newSale")}</span>
      </button>

      {/* Language */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-md border border-line text-sm hover:bg-hover transition-colors"
        title="Toggle language"
      >
        <Languages size={15} strokeWidth={1.8} />
        <span className="hidden sm:inline font-medium">{t("langToggle")}</span>
      </button>

      {/* Theme */}
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-9 h-9 rounded-md border border-line hover:bg-hover transition-colors"
        title="Toggle theme"
      >
        {theme === "light" ? (
          <Moon size={15} strokeWidth={1.8} />
        ) : (
          <Sun size={15} strokeWidth={1.8} />
        )}
      </button>
    </header>
  );
}
