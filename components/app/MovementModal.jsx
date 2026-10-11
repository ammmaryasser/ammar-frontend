"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useLang } from "@/contexts/LanguageContext";
import { formatNum } from "@/lib/format";
import { recordStockIn, recordAdjustment } from "@/services/movementsService";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm focus:outline-none focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1.5";

export default function MovementModal({ kind, parts, onClose, onSaved }) {
  const { t, isAr } = useLang();
  const isAdjust = kind === "adj";
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("");
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const part = parts.find((p) => p.id === partId);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!partId) {
      setError(t("selectPartFirst"));
      return;
    }
    const n = Math.abs(Number(qty));
    if (!n) {
      setError(t("enterQty"));
      return;
    }
    setSaving(true);
    try {
      if (isAdjust) {
        const delta = qty < 0 ? -n : n;
        await recordAdjustment({ partId, delta, ref: ref.replace(/^-\s*/, "") });
      } else {
        await recordStockIn({ partId, qty: n, ref });
      }
      onSaved();
    } catch (err) {
      setError(err.field ? `${err.field}: ${err.message}` : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isAdjust ? t("adjustStock") : t("stockIn")}>
      <form onSubmit={onSubmit}>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>{t("part")} *</label>
            <select
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              className={`${inputCls} font-mono`}
            >
              <option value="">—</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.oem} — {isAr && p.nameAr ? p.nameAr : p.name} ({formatNum(p.qty)})
                </option>
              ))}
            </select>
            {part && (
              <p className="text-[11px] text-muted mt-1.5">
                {t("onHand")}: <span className="font-mono font-semibold">{formatNum(part.qty)}</span>
                {" · "}
                {t("reorderAt")} {formatNum(part.reorderAt)}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>{isAdjust ? t("adjustQty") : t("receivedQty")} *</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={isAdjust ? "+2 or -3" : "10"}
              className={`${inputCls} font-mono`}
            />
            {isAdjust && <p className="text-[11px] text-muted mt-1.5">{t("adjustHint")}</p>}
          </div>
          <div>
            <label className={labelCls}>{isAdjust ? t("reason") : t("shipmentRef")}</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={isAdjust ? t("damageNote") : "SHIP-121"}
              className={`${inputCls} font-mono`}
            />
          </div>
          {error && (
            <div className="rounded-md bg-bad-bg text-bad text-xs font-medium px-3 py-2">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-line text-sm text-muted hover:bg-hover hover:text-ink transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
