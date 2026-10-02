"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, TrendingUp, FileText, Boxes } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { getReport } from "@/services/reportsService";

const RANGES = [
  ["month", "thisMonth"],
  ["30d", "last30"],
  ["all", "allTime"],
];

export default function ReportsPage() {
  const { t } = useLang();
  const [range, setRange] = useState("month");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r) => {
    setLoading(true);
    setReport(await getReport(r));
    setLoading(false);
  }, []);
  useEffect(() => {
    load(range);
  }, [load, range]);

  const empty = !loading && report && report.invoices === 0;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("reports")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatNum(report?.invoices ?? 0)} {t("invoices")}
            {!empty && report && ` · ${formatEGP(report.profit)} ${t("profit")}`}
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map(([v, key]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${
                range === v
                  ? "border-ink text-ink bg-hover"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          icon={Banknote}
          label={t("revenue")}
          value={report ? formatEGP(report.revenue) : "—"}
        />
        <Kpi
          icon={TrendingUp}
          label={t("profit")}
          value={report ? formatEGP(report.profit) : "—"}
          tone="ok"
        />
        <Kpi
          icon={Boxes}
          label={t("unitsSold")}
          value={report ? formatNum(report.units) : "—"}
        />
        <Kpi
          icon={FileText}
          label={t("avgMargin")}
          value={report ? `${formatNum(report.avgMargin)}%` : "—"}
          sub={report ? `${formatNum(report.invoices)} ${t("invoices")}` : ""}
        />
      </div>

      {empty ? (
        <div className="bg-surface rounded-lg border border-line px-4 py-14 text-center text-sm text-muted">
          {t("noSalesYet")}
        </div>
      ) : (
        <>
          <MonthlyChart monthly={report?.monthly ?? []} loading={loading} />
          <BestSellers rows={report?.bestSellers ?? []} loading={loading} />
          <BrandBreakdown rows={report?.brands ?? []} loading={loading} />
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-surface rounded-lg border border-line p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted uppercase tracking-[0.06em]">{label}</span>
        <span
          className={`flex items-center justify-center w-7 h-7 rounded-md ${
            tone === "ok" ? "text-ok bg-ok-bg" : "text-muted bg-bg"
          }`}
        >
          <Icon size={14} strokeWidth={2} />
        </span>
      </div>
      <div className="font-mono text-xl font-semibold mt-2">{value}</div>
      {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
    </div>
  );
}

// Grouped bar chart: revenue (accent) + profit (green) per month — hand-rolled SVG.
function MonthlyChart({ monthly, loading }) {
  const { t } = useLang();
  return (
    <section className="bg-surface rounded-lg border border-line p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("monthlyPerformance")}</h2>
        <div className="flex items-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent" /> {t("revenue")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-ok" /> {t("profit")}
          </span>
        </div>
      </div>
      <div className="mt-4">
        {loading || monthly.length === 0 ? (
          <div className="h-44 rounded-md bg-hover animate-pulse" />
        ) : (
          <MonthlyBars monthly={monthly} />
        )}
      </div>
    </section>
  );
}

function MonthlyBars({ monthly }) {
  const W = 720;
  const H = 200;
  const PAD_L = 8;
  const PAD_B = 26;
  const GROUP = 64;
  const BAR = 22;
  const GAP = 4;
  const max = Math.max(...monthly.map((m) => Math.max(m.revenue, m.profit))) || 1;
  const step = monthly.length > 1 ? (W - PAD_L - GROUP) / (monthly.length - 1) : 0;
  const bh = (v) => Math.max(2, (v / max) * (H - PAD_B - 18));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" role="img">
      {monthly.map((m, i) => {
        const cx = PAD_L + i * step + GROUP / 2;
        const base = H - PAD_B;
        return (
          <g key={m.month}>
            <rect
              x={cx - BAR - GAP / 2}
              y={base - bh(m.revenue)}
              width={BAR}
              height={bh(m.revenue)}
              rx="2"
              fill="var(--accent)"
            />
            <rect
              x={cx + GAP / 2}
              y={base - bh(m.profit)}
              width={BAR}
              height={bh(m.profit)}
              rx="2"
              fill="var(--ok)"
            />
            <text x={cx} y={base - bh(m.revenue) - 6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
              {(m.revenue / 1000).toFixed(0)}k
            </text>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
              {m.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Best sellers table
function BestSellers({ rows, loading }) {
  const { t, isAr } = useLang();
  return (
    <section className="bg-surface rounded-lg border border-line overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold">{t("bestSellers")}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line bg-bg">
              {[t("rank"), t("part"), t("unitsSold"), t("revenue"), t("profit"), t("profitMargin")].map(
                (h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                      i >= 2 ? "text-end" : "text-start"
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3.5">
                      <div className="h-4 bg-hover rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              : rows.map((r, i) => (
                  <tr key={r.partId} className="hover:bg-hover transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{isAr && r.nameAr ? r.nameAr : r.name}</div>
                      <div className="text-xs text-muted font-mono">
                        {r.oem} · {r.brand}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end font-mono">{formatNum(r.qty)}</td>
                    <td className="px-4 py-3 text-end font-mono font-semibold">
                      {formatNum(r.revenue)}
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-ok">
                      {formatNum(r.profit)}
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-muted">
                      {formatNum(r.margin)}%
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Brand breakdown — horizontal share bars
function BrandBreakdown({ rows, loading }) {
  const { t } = useLang();
  return (
    <section className="bg-surface rounded-lg border border-line p-5">
      <h2 className="text-sm font-semibold">{t("brandBreakdown")}</h2>
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-hover rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {rows.map((b) => (
            <li key={b.brand}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium">{b.brand}</span>
                <span className="font-mono text-xs text-muted">
                  {formatNum(b.units)} · {formatNum(b.revenue)} EGP · {formatNum(b.share)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg border border-line overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${b.share}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
