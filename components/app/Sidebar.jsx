"use client";

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
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function Sidebar() {
  const { t } = useLang();
  const pathname = usePathname();

  const nav = [
    { href: "/", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/parts", icon: Package, label: t("parts") },
    { href: "/movements", icon: ArrowLeftRight, label: t("movements") },
    { href: "/sales", icon: Receipt, label: t("sales") },
    { href: "/customers", icon: Users, label: t("customers") },
    { href: "/reports", icon: ChartNoAxesColumn, label: t("reports") },
    { href: "/settings", icon: Settings, label: t("settings") },
  ];

  return (
    <aside className="hidden md:flex fixed inset-y-0 start-0 w-60 flex-col bg-side-bg text-side-ink">
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-side-line">
        <span className="w-7 h-7 rounded-[4px] bg-accent flex items-center justify-center text-accent-ink font-mono font-semibold text-sm">
          A
        </span>
        <div className="leading-tight">
          <div className="text-side-on font-semibold text-sm tracking-wide">
            Amar Yasser
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono">
            Spare Parts · EG
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-side-active text-side-on font-medium"
                  : "hover:bg-side-hover hover:text-side-on"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-side-line text-[10px] font-mono uppercase tracking-[0.18em]">
        German Parts · Egypt
      </div>
    </aside>
  );
}
