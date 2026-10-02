"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Receipt,
  Users,
  ChartNoAxesColumn,
  Settings,
  Ellipsis,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

// Mobile bottom navigation. Primary destinations as tabs; everything else
// lives in the "More" sheet so the bar never crowds on small screens.
export default function MobileNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { href: "/", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/parts", icon: Package, label: t("parts") },
    { href: "/movements", icon: ArrowLeftRight, label: t("movements") },
    { href: "/sales", icon: Receipt, label: t("sales") },
  ];

  const more = [
    { href: "/customers", icon: Users, label: t("customers") },
    { href: "/reports", icon: ChartNoAxesColumn, label: t("reports") },
    { href: "/settings", icon: Settings, label: t("settings") },
  ];

  const moreActive = more.some((m) => m.href === pathname);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch bg-side-bg border-t border-side-line pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                active ? "text-accent" : "text-side-ink active:text-side-on"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.1 : 1.8} />
              <span className="truncate max-w-full px-1">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
            moreActive ? "text-accent" : "text-side-ink active:text-side-on"
          }`}
        >
          <Ellipsis size={19} strokeWidth={moreActive ? 2.1 : 1.8} />
          <span className="truncate max-w-full px-1">{t("more")}</span>
        </button>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 inset-x-0 bg-surface border-t border-line rounded-t-xl p-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-line mb-2" />
            {more.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${
                  pathname === href ? "bg-hover text-ink font-medium" : "text-muted"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
