"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { stockStatus } from "@/lib/data";
import { getPart, deletePart } from "@/services/partsService";
import PartImage from "@/components/app/PartImage";
import StatusBadge from "@/components/app/StatusBadge";
import PriceChart from "@/components/app/PriceChart";
import PartFormModal from "@/components/app/PartFormModal";
import Modal from "@/components/ui/Modal";

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export default function PartDetailPage() {
  const { t, isAr } = useLang();
  const { id } = useParams();
  const router = useRouter();

  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPart(await getPart(id));
    setLoading(false);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="max-w-[1400px] space-y-4">
        <div className="h-8 w-40 bg-hover rounded animate-pulse" />
        <div className="h-64 bg-hover rounded-lg animate-pulse" />
      </div>
    );

  if (!part)
    return (
      <div className="max-w-[1400px] py-20 text-center space-y-3">
        <p className="text-sm text-muted">{t("notFound")}</p>
        <Link href="/parts" className="text-sm text-accent font-medium hover:underline">
          {t("backToParts")}
        </Link>
      </div>
    );

  const margin = part.price - part.cost;
  const marginPct = part.cost > 0 ? Math.round((margin / part.cost) * 100) : 0;

  const logIcon = { in: ArrowDownLeft, out: ArrowUpRight, adj: RefreshCcw };
  const logTone = { in: "text-ok", out: "text-bad", adj: "text-muted" };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/parts"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("backToParts")}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Pencil size={14} strokeWidth={2} />
            {t("editPart")}
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            className="flex items-center gap-2 h-9 px-3.5 rounded-md border border-line text-sm text-bad hover:bg-bad-bg transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.8} />
            {t("deletePart")}
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-surface rounded-lg border border-line p-5 flex flex-col sm:flex-row items-start gap-5">
        <PartImage className="w-20 h-20" iconSize={30} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              {isAr ? part.nameAr : part.name}
            </h1>
            <StatusBadge status={stockStatus(part)} t={t} />
          </div>
          <div className="mt-1 font-mono text-sm text-muted">{part.oem}</div>
          <div className="mt-0.5 text-sm text-muted">
            {part.brand} · {isAr && part.categoryAr ? part.categoryAr : part.category}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Photos */}
          <section className="bg-surface rounded-lg border border-line p-5">
            <h2 className="text-sm font-semibold">{t("details")}</h2>
            <div className="mt-4">
              <PartImage className="w-full h-52" iconSize={32} />
              <p className="mt-2 text-[11px] text-muted text-center">
                {t("noPhotos")}
              </p>
            </div>
          </section>

          {/* Fitment */}
          <section className="bg-surface rounded-lg border border-line p-5">
            <h2 className="text-sm font-semibold">{t("fitment")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(part.fitment || []).length > 0 ? (
                part.fitment.map((f) => (
                  <span
                    key={f}
                    className="font-mono text-xs px-2.5 py-1.5 rounded-md bg-bg border border-line"
                  >
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </div>
          </section>

          {/* Price history */}
          {part.priceHistory?.length > 1 && (
            <section className="bg-surface rounded-lg border border-line p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t("priceHistory")}</h2>
                <span className="font-mono text-sm font-semibold">
                  {formatNum(part.price)} EGP
                </span>
              </div>
              <div className="mt-3">
                <PriceChart data={part.priceHistory} />
              </div>
            </section>
          )}

          {/* Stock log */}
          <section className="bg-surface rounded-lg border border-line p-5">
            <h2 className="text-sm font-semibold">{t("stockLog")}</h2>
            <ul className="mt-3 divide-y divide-line">
              {(part.history || []).map((h, i) => {
                const Icon = logIcon[h.type];
                const positive =
                  h.type === "in" || (h.type === "adj" && h.qty > 0);
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${logTone[h.type]} bg-bg`}
                    >
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="font-mono text-xs text-muted w-20">
                      {h.date}
                    </span>
                    <span className="text-xs text-muted flex-1">{h.ref}</span>
                    <span
                      className={`font-mono text-sm font-semibold ${positive ? "text-ok" : "text-bad"}`}
                    >
                      {h.qty > 0 ? `+${h.qty}` : h.qty}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Right column: details */}
        <div className="space-y-4">
          <section className="bg-surface rounded-lg border border-line p-5">
            <h2 className="text-sm font-semibold mb-2">{t("details")}</h2>
            <DetailRow label={t("quantity")}>
              <span className="font-mono">{part.qty}</span>
            </DetailRow>
            <DetailRow label={t("reorderAt")}>
              <span className="font-mono">{part.reorderAt}</span>
            </DetailRow>
            <DetailRow label={t("location")}>
              <span className="font-mono">{part.location || "—"}</span>
            </DetailRow>
            <DetailRow label={t("cost")}>
              <span className="font-mono">{formatEGP(part.cost)}</span>
            </DetailRow>
            <DetailRow label={t("retail")}>
              <span className="font-mono">{formatEGP(part.price)}</span>
            </DetailRow>
            <DetailRow label={t("profitMargin")}>
              <span className="font-mono text-ok">
                {formatEGP(margin)} ({marginPct}%)
              </span>
            </DetailRow>
          </section>
        </div>
      </div>

      {/* Modals */}
      <PartFormModal
        open={editOpen}
        part={part}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />
      <Modal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title={t("confirmDelete")}
      >
        <div className="p-5">
          <p className="text-sm text-muted">{t("confirmDeleteMsg")}</p>
          <div className="mt-3 font-mono text-xs text-muted">
            {part.oem} · {isAr ? part.nameAr : part.name}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-line">
          <button
            onClick={() => setConfirmDel(false)}
            className="h-9 px-4 rounded-md border border-line text-sm hover:bg-hover transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={async () => {
              await deletePart(part.id);
              router.push("/parts");
            }}
            className="h-9 px-4 rounded-md bg-bad text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("deletePart")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
