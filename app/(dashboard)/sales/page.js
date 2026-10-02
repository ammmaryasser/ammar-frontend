"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Eye, Banknote, Printer, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import NewSaleModal from "@/components/app/NewSaleModal";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { getSales } from "@/services/salesService";

export default function SalesPage() {
  return (
    <Suspense fallback={null}>
      <SalesInner />
    </Suspense>
  );
}

function SalesInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setSales(await getSales());
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Open the New Sale modal when arriving from the topbar button
  useEffect(() => {
    if (searchParams.get("new") === "1") setNewOpen(true);
  }, [searchParams]);

  const revenue = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("sales")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatNum(sales.length)} {t("invoices")} · {formatEGP(revenue)}
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} strokeWidth={2.2} />
          {t("newSale")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg">
                {[t("invoiceNo"), t("date"), t("customer"), t("items"), t("total"), t("status"), ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                        i >= 3 ? "text-end" : "text-start"
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
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3.5">
                        <div className="h-4 bg-hover rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : sales.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setDetail(s)}
                      className="hover:bg-hover cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">{s.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                        {s.date}
                      </td>
                      <td className="px-4 py-3 font-medium">{s.customerName}</td>
                      <td className="px-4 py-3 text-end font-mono">{formatNum(s.itemsCount)}</td>
                      <td className="px-4 py-3 text-end font-mono font-semibold">
                        {formatNum(s.total)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <StatusPill status={s.status} t={t} />
                      </td>
                      <td className="px-2 py-3 text-end">
                        <span className="inline-flex p-2 text-muted">
                          <Eye size={14} />
                        </span>
                      </td>
                    </tr>
                  ))}
              {!loading && sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                    {t("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <InvoiceModal sale={detail} t={t} onClose={() => setDetail(null)} />}

      <NewSaleModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSaved={() => {
          setNewOpen(false);
          load();
        }}
      />
    </div>
  );
}

function StatusPill({ status, t }) {
  const paid = status === "PAID";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        paid ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"
      }`}
    >
      {paid ? t("paid") : t("pending")}
    </span>
  );
}

function InvoiceModal({ sale, t, onClose }) {
  return (
    <Modal open onClose={onClose} title={sale.id} wide>
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/print/invoice/${sale.id}`}
            target="_blank"
            className="flex items-center gap-2 h-8 px-3.5 rounded-md bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Printer size={13} strokeWidth={2.2} />
            {t("printInvoice")}
          </Link>
          <Link
            href={`/print/quote/${sale.id}`}
            target="_blank"
            className="flex items-center gap-2 h-8 px-3.5 rounded-md border border-line text-xs font-medium text-muted hover:bg-hover hover:text-ink transition-colors"
          >
            <FileText size={13} strokeWidth={2} />
            {t("printQuote")}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeadCell label={t("customer")} value={sale.customerName} />
          <HeadCell label={t("date")} value={sale.date} mono />
          <HeadCell label={t("total")} value={formatEGP(sale.total)} mono />
          <HeadCell
            label={t("profitMargin")}
            value={
              <span className="inline-flex items-center gap-1 text-ok">
                <Banknote size={13} />
                {formatEGP(sale.profit)}
              </span>
            }
          />
        </div>
        <div className="border border-line rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg">
                {[t("part"), t("qty"), t("unitPrice"), t("total")].map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                      i === 0 ? "text-start" : "text-end"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sale.items.map((it, i) => (
                <tr key={i}>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{isAr && it.nameAr ? it.nameAr : it.name}</div>
                    <div className="text-xs text-muted font-mono">{it.oem}</div>
                  </td>
                  <td className="px-3 py-2.5 text-end font-mono">{formatNum(it.qty)}</td>
                  <td className="px-3 py-2.5 text-end font-mono">{formatNum(it.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-end font-mono font-semibold">
                    {formatNum(it.qty * it.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            {t("itemsCount")}: {formatNum(sale.itemsCount)}
          </span>
          <span className="font-mono font-semibold">{formatEGP(sale.total)}</span>
        </div>
      </div>
    </Modal>
  );
}

function HeadCell({ label, value, mono }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="text-[11px] text-muted uppercase tracking-[0.06em]">{label}</div>
      <div className={`text-sm font-semibold mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
