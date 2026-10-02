"use client";

import { useLang } from "@/contexts/LanguageContext";
import { formatNum } from "@/lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize, total, onPage }) {
  const { t, isAr } = useLang();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-xs text-muted">
        {t("showing")} {formatNum(from)}–{formatNum(to)} {t("of")}{" "}
        {formatNum(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-line hover:bg-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <PrevIcon size={14} />
        </button>
        <span className="font-mono text-xs text-muted px-1">
          {formatNum(page)} / {formatNum(pages)}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-line hover:bg-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <NextIcon size={14} />
        </button>
      </div>
    </div>
  );
}
