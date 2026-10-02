"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { dict } from "@/lib/i18n";
import { useShopSettings } from "@/lib/settings";
import { formatEGP, formatNum } from "@/lib/format";

// Printable invoice / quotation. The sheet uses fixed light colors on purpose:
// documents must stay light regardless of app theme and print correctly.
export default function PrintDocument({ type, sale }) {
  const { lang: appLang } = useLang();
  const shop = useShopSettings();
  const [docLang, setDocLang] = useState(appLang);
  const isInvoice = type === "invoice";
  const dt = (k) => dict[docLang]?.[k] ?? k;
  const isAr = docLang === "ar";
  const docNo = isInvoice ? sale.id : sale.id.replace("INV", "QTN");
  const total = sale.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        fontFamily: isAr
          ? "var(--font-plex-arabic), var(--font-plex-sans), sans-serif"
          : "var(--font-plex-sans), sans-serif",
      }}
    >
      {/* Toolbar — screen only */}
      <div className="no-print max-w-[820px] mx-auto flex items-center justify-between py-4">
        <Link
          href="/sales"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {dict[appLang].sales}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line overflow-hidden">
            {["en", "ar"].map((l) => (
              <button
                key={l}
                onClick={() => setDocLang(l)}
                className={`h-8 px-3 text-xs font-medium transition-colors ${
                  docLang === l ? "bg-ink text-bg" : "text-muted hover:text-ink"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-8 px-3.5 rounded-md bg-accent text-accent-ink text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Printer size={13} strokeWidth={2.2} />
            {dt("printBtn")}
          </button>
        </div>
      </div>

      {/* Sheet */}
      <div className="print-sheet max-w-[820px] mx-auto mb-10 bg-white text-[#16181A] border border-[#E1E2E0] shadow-sm">
        <div className="h-1 bg-[#F0B429]" />
        <div className="px-10 pt-8 pb-10">
          {/* Letterhead */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-[#16181A]">
            <div>
              <div className="text-lg font-bold tracking-[0.18em]">
                {isAr ? shop.shopNameAr : shop.shopNameEn}
              </div>
              <div className="text-[11px] text-[#6B7075] mt-1">
                {isAr ? shop.taglineAr : shop.taglineEn}
              </div>
              <div className="font-mono text-[10px] text-[#6B7075] mt-1">
                {shop.phone} · {isAr ? shop.addressAr : shop.addressEn}
              </div>
            </div>
            <div className="text-end">
              <div className="text-sm font-bold tracking-[0.12em]">
                {isInvoice ? dt("docInvoice") : dt("docQuote")}
              </div>
              <div className="font-mono text-xs text-[#6B7075] mt-1">{docNo}</div>
              <div className="font-mono text-xs text-[#6B7075]">{sale.date}</div>
            </div>
          </div>

          {/* Bill-to + doc meta */}
          <div className="flex items-start justify-between py-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-[#6B7075]">
                {dt("billTo")}
              </div>
              <div className="text-sm font-semibold mt-1.5">{sale.customerName}</div>
              {sale.customerPhone && (
                <div className="font-mono text-xs text-[#6B7075] mt-0.5">{sale.customerPhone}</div>
              )}
              {sale.customerCar && (
                <div className="text-xs text-[#6B7075] mt-0.5">{sale.customerCar}</div>
              )}
            </div>
            {isInvoice ? (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  sale.status === "PAID"
                    ? "bg-[#E7F2EB] text-[#2F7D4F]"
                    : "bg-[#FBF3E1] text-[#A97014]"
                }`}
              >
                {sale.status === "PAID" ? dt("paid") : dt("pending")}
              </span>
            ) : (
              <div className="text-[11px] text-[#6B7075] max-w-[250px] text-end leading-relaxed">
                {dt("validityNote")}
              </div>
            )}
          </div>

          {/* Items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-[#16181A]">
                <th className="py-2 text-start text-[10px] uppercase tracking-[0.12em] text-[#6B7075] font-medium">
                  #
                </th>
                <th className="py-2 text-start text-[10px] uppercase tracking-[0.12em] text-[#6B7075] font-medium">
                  {dt("item")}
                </th>
                <th className="py-2 text-end text-[10px] uppercase tracking-[0.12em] text-[#6B7075] font-medium">
                  {dt("qty")}
                </th>
                <th className="py-2 text-end text-[10px] uppercase tracking-[0.12em] text-[#6B7075] font-medium">
                  {dt("unitPrice")}
                </th>
                <th className="py-2 text-end text-[10px] uppercase tracking-[0.12em] text-[#6B7075] font-medium">
                  {dt("amount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E2E0]">
              {sale.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2.5 font-mono text-xs text-[#6B7075]">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2.5">
                    <div className="font-medium">{isAr && it.nameAr ? it.nameAr : it.name}</div>
                    <div className="font-mono text-[11px] text-[#6B7075]">{it.oem}</div>
                  </td>
                  <td className="py-2.5 text-end font-mono">{formatNum(it.qty)}</td>
                  <td className="py-2.5 text-end font-mono">{formatNum(it.unitPrice)}</td>
                  <td className="py-2.5 text-end font-mono font-semibold">
                    {formatNum(it.qty * it.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-5">
            <div className="w-full max-w-[280px] space-y-2">
              <div className="flex justify-between text-sm text-[#6B7075]">
                <span>{dt("subtotal")}</span>
                <span className="font-mono">{formatNum(total)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t-2 border-[#16181A] pt-2">
                <span className="text-sm font-bold">{dt("totalDue")}</span>
                <span className="font-mono text-lg font-bold">{formatEGP(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer notes */}
          <div className="mt-10 pt-4 border-t border-[#E1E2E0] flex items-end justify-between">
            <div className="text-[11px] text-[#6B7075] max-w-[380px] leading-relaxed">
              <p className="font-medium text-[#16181A]">{dt("thanksNote")}</p>
              {isInvoice && <p className="mt-1">{dt("termsNote")}</p>}
            </div>
            <div className="text-end">
              <div className="text-[10px] uppercase tracking-[0.12em] text-[#6B7075] mb-1">
                {isAr ? "التوقيع" : "Signature"}
              </div>
              <div className="w-40 border-b border-[#16181A]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
