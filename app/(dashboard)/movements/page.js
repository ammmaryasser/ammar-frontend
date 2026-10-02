"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, PackagePlus, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatNum } from "@/lib/format";
import { getMovements, recordStockIn, recordAdjustment } from "@/services/movementsService";
import { getParts } from "@/services/partsService";
import MovementModal from "@/components/app/MovementModal";

const typeMeta = {
  in: { icon: ArrowDownLeft, tone: "text-ok", bg: "bg-ok-bg", label: "mIn" },
  out: { icon: ArrowUpRight, tone: "text-bad", bg: "bg-bad-bg", label: "mOut" },
  adj: { icon: RefreshCcw, tone: "text-warn", bg: "bg-warn-bg", label: "mAdj" },
};

export default function MovementsPage() {
  const { t, isAr } = useLang();
  const [movements, setMovements] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [modal, setModal] = useState(null); // "in" | "adj"

  const load = useCallback(async () => {
    setLoading(true);
    const [ms, ps] = await Promise.all([getMovements(), getParts()]);
    setMovements(ms);
    setParts(ps);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => movements.filter((m) => !filter || m.type === filter),
    [movements, filter],
  );

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("movements")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatNum(movements.length)} {t("entries")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("adj")}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md border border-line text-sm font-medium hover:bg-hover transition-colors"
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            {t("adjustStock")}
          </button>
          <button
            onClick={() => setModal("in")}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PackagePlus size={15} strokeWidth={2} />
            {t("stockIn")}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {[
          ["", t("all")],
          ["in", t("mIn")],
          ["out", t("mOut")],
          ["adj", t("mAdj")],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`h-8 px-3 rounded-md text-xs font-medium border transition-colors ${
              filter === v
                ? "border-ink text-ink bg-hover"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg">
                {[t("date"), t("type"), t("part"), t("qty"), t("reference")].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                      i >= 3 ? "text-end" : "text-start"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-3.5">
                        <div className="h-4 bg-hover rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : filtered.map((m) => {
                    const meta = typeMeta[m.type];
                    const Icon = meta.icon;
                    const positive = m.type === "in" || (m.type === "adj" && m.qty > 0);
                    return (
                      <tr key={m.id} className="hover:bg-hover transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                          {t(m.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.bg} ${meta.tone}`}
                          >
                            <Icon size={11} strokeWidth={2.2} />
                            {t(meta.label)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {isAr && m.nameAr ? m.nameAr : m.name}
                          </div>
                          <div className="text-xs text-muted font-mono">{m.part} · {m.ref}</div>
                        </td>
                        <td
                          className={`px-4 py-3 text-end font-mono font-semibold ${
                            positive ? "text-ok" : "text-bad"
                          }`}
                        >
                          {m.qty > 0 ? `+${formatNum(m.qty)}` : formatNum(m.qty)}
                        </td>
                        <td className="px-4 py-3 text-end font-mono text-xs text-muted">
                          {m.ref}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    {t("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <MovementModal
          kind={modal}
          parts={parts}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
