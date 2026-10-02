"use client";

import Link from "next/link";
import {
  Boxes,
  Banknote,
  TrendingUp,
  TriangleAlert,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { parts, movements, kpis, stockStatus } from "@/lib/data";

function KpiCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-surface rounded-lg border border-line p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-muted font-medium">
          {label}
        </span>
        <Icon
          size={16}
          strokeWidth={1.8}
          className={tone === "warn" ? "text-warn" : "text-muted"}
        />
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  if (status === "out")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-bad-bg text-bad">
        {t("outOfStock")}
      </span>
    );
  if (status === "low")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warn-bg text-warn">
        {t("low")}
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ok-bg text-ok">
      {t("inStock")}
    </span>
  );
}

export default function DashboardPage() {
  const { t, isAr } = useLang();

  const lowStockParts = parts
    .filter((p) => stockStatus(p) !== "ok")
    .sort((a, b) => a.qty - b.qty);

  const movementIcon = {
    in: ArrowDownLeft,
    out: ArrowUpRight,
    adj: RefreshCcw,
  };
  const movementTone = {
    in: "text-ok",
    out: "text-bad",
    adj: "text-muted",
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("dashboard")}</h1>
        <p className="text-sm text-muted mt-0.5">
          {formatNum(1847)} {t("partsOnHand")} · {kpis.lowStock}{" "}
          {t("needAttention")}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Boxes}
          label={t("stockValue")}
          value={formatEGP(kpis.stockValue)}
          sub={`+${kpis.stockDelta}% ${t("vsLastMonth")}`}
        />
        <KpiCard
          icon={Banknote}
          label={t("todaysSales")}
          value={formatEGP(kpis.todaysSales)}
          sub={`${kpis.invoicesToday} ${t("invoicesToday")}`}
        />
        <KpiCard
          icon={TrendingUp}
          label={t("profitThisMonth")}
          value={formatEGP(kpis.monthProfit)}
          sub={`+${kpis.profitDelta}% ${t("vsLastMonth")}`}
        />
        <KpiCard
          icon={TriangleAlert}
          label={t("lowStock")}
          value={`${formatNum(kpis.lowStock)} ${t("items")}`}
          sub={`${kpis.critical} ${t("critical")}`}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Low stock alerts */}
        <section className="bg-surface rounded-lg border border-line p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("lowStockAlerts")}</h2>
            <Link
              href="/parts"
              className="text-xs text-muted hover:text-accent transition-colors font-medium"
            >
              {t("viewAll")}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {lowStockParts.map((p) => {
              const out = p.qty === 0;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 pb-3 border-b border-line last:border-0 last:pb-0"
                >
                  <span
                    className={`w-1.5 h-8 rounded-full shrink-0 ${out ? "bg-bad" : "bg-warn"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {isAr ? p.nameAr : p.name}
                    </div>
                    <div className="text-xs text-muted font-mono">
                      {p.oem} · {p.brand}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div
                      className={`font-mono text-sm font-semibold ${out ? "text-bad" : "text-warn"}`}
                    >
                      {out ? t("outOf") : formatNum(p.qty)}
                    </div>
                    <div className="text-[11px] text-muted font-mono">
                      {t("reorderAt")} {p.reorderAt}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recent movements */}
        <section className="bg-surface rounded-lg border border-line p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("recentMovements")}</h2>
            <Link
              href="/movements"
              className="text-xs text-muted hover:text-accent transition-colors font-medium"
            >
              {t("viewAll")}
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {movements.map((m) => {
              const Icon = movementIcon[m.type];
              const positive =
                m.type === "in" || (m.type === "adj" && m.qty > 0);
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${movementTone[m.type]} bg-bg`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">
                      {isAr && m.nameAr ? m.nameAr : m.name}
                    </div>
                    <div className="text-xs text-muted font-mono">
                      {m.part} · {m.ref}
                    </div>
                  </div>
                  <div className="text-xs text-muted shrink-0 w-16">
                    {t(m.date)}
                  </div>
                  <div
                    className={`font-mono text-sm font-semibold shrink-0 w-14 text-end ${positive ? "text-ok" : "text-bad"}`}
                  >
                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Parts catalog preview */}
      <section className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-4">
          <h2 className="text-sm font-semibold">{t("partsCatalog")}</h2>
          <Link
            href="/parts"
            className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors font-medium"
          >
            {t("viewAllCount")}
            <ArrowRight size={13} className="rtl:rotate-180" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line bg-bg">
                {[
                  t("partNo"),
                  t("part"),
                  t("category"),
                  t("qty"),
                  t("location"),
                  t("price"),
                  t("status"),
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                      i >= 3 && i <= 5 ? "text-end" : "text-start"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {parts.slice(0, 6).map((p) => (
                <tr key={p.id} className="hover:bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {p.oem}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{isAr ? p.nameAr : p.name}</div>
                    <div className="text-xs text-muted">
                      {p.brand} · {(p.fitment || [])[0]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {isAr && p.categoryAr ? p.categoryAr : p.category}
                  </td>
                  <td className="px-4 py-3 text-end font-mono">{p.qty}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {p.location}
                  </td>
                  <td className="px-4 py-3 text-end font-mono">
                    {formatNum(p.price)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <StatusBadge status={stockStatus(p)} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
