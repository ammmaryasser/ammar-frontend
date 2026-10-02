"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useLang } from "@/contexts/LanguageContext";
import { brandNames, categoryOptions } from "@/lib/data";
import { formatEGP } from "@/lib/format";
import { savePart } from "@/services/partsService";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1.5";

export default function PartFormModal({ open, part, onClose, onSaved }) {
  const { t, isAr } = useLang();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-seed local state each time the modal opens with a different part
  const [seed, setSeed] = useState(null);
  if (open && seed !== (part?.id ?? "new")) {
    setSeed(part?.id ?? "new");
    setErrors(false);
    setForm(
      part
        ? { ...part, fitment: (part.fitment || []).join("\n") }
        : {
            oem: "",
            name: "",
            nameAr: "",
            brand: "",
            category: "",
            qty: 0,
            reorderAt: 2,
            location: "",
            cost: "",
            price: "",
            fitment: "",
          },
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const margin =
    Number(form.cost) > 0 && Number(form.price) > 0
      ? Number(form.price) - Number(form.cost)
      : null;

  async function onSubmit(e) {
    e.preventDefault();
    const missing =
      !form.oem?.trim() || !form.name?.trim() || !form.brand || !form.category;
    setErrors(missing);
    if (missing) return;
    setSaving(true);
    const payload = {
      ...form,
      qty: Number(form.qty) || 0,
      reorderAt: Number(form.reorderAt) || 0,
      cost: Number(form.cost) || 0,
      price: Number(form.price) || 0,
      fitment: (form.fitment || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const saved = await savePart(payload);
    setSaving(false);
    onSaved(saved);
  }

  return (
    <Modal open={open} onClose={onClose} title={part ? t("editPart") : t("addPart")} wide>
      <form onSubmit={onSubmit}>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("oemNo")} *</label>
            <input
              value={form.oem ?? ""}
              onChange={set("oem")}
              placeholder="34116794300"
              className={`${inputCls} font-mono ${errors && !form.oem?.trim() ? "border-bad" : ""}`}
            />
          </div>
          <div>
            <label className={labelCls}>{t("nameEn")} *</label>
            <input
              value={form.name ?? ""}
              onChange={set("name")}
              placeholder="Front Brake Pads Set"
              className={`${inputCls} ${errors && !form.name?.trim() ? "border-bad" : ""}`}
            />
          </div>
          <div>
            <label className={labelCls}>{t("nameAr")}</label>
            <input
              value={form.nameAr ?? ""}
              onChange={set("nameAr")}
              placeholder="طقم فحمات فرامل أمامي"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("brand")} *</label>
            <select
              value={form.brand ?? ""}
              onChange={set("brand")}
              className={`${inputCls} ${errors && !form.brand ? "border-bad" : ""}`}
            >
              <option value="">—</option>
              {brandNames.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("category")} *</label>
            <select
              value={form.category ?? ""}
              onChange={set("category")}
              className={`${inputCls} ${errors && !form.category ? "border-bad" : ""}`}
            >
              <option value="">—</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {isAr ? c.ar : c.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("location")}</label>
            <input
              value={form.location ?? ""}
              onChange={set("location")}
              placeholder="A2-04"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t("fitment")}</label>
            <textarea
              value={form.fitment ?? ""}
              onChange={set("fitment")}
              rows={2}
              placeholder={"3 Series F30 (2012–2019)\n4 Series F32 (2013–2020)"}
              className="w-full px-3 py-2 rounded-md bg-bg border border-line text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-[11px] text-muted mt-1">{t("fitmentHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("quantity")}</label>
              <input
                type="number"
                min="0"
                value={form.qty ?? ""}
                onChange={set("qty")}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>{t("reorderAt")}</label>
              <input
                type="number"
                min="0"
                value={form.reorderAt ?? ""}
                onChange={set("reorderAt")}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("cost")} (EGP)</label>
              <input
                type="number"
                min="0"
                value={form.cost ?? ""}
                onChange={set("cost")}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>{t("retail")} (EGP)</label>
              <input
                type="number"
                min="0"
                value={form.price ?? ""}
                onChange={set("price")}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>
          {margin !== null && (
            <div className="sm:col-span-2 text-xs">
              <span className="text-muted">{t("profitMargin")}: </span>
              <span className="font-mono text-ok font-medium">
                {formatEGP(margin)} ({Math.round((margin / Number(form.cost)) * 100)}%)
              </span>
            </div>
          )}
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 w-full h-16 rounded-md border border-dashed border-line text-muted text-xs cursor-not-allowed justify-center"
            >
              <Camera size={15} strokeWidth={1.8} />
              {t("noPhotos")}
            </button>
          </div>
          {errors && (
            <p className="sm:col-span-2 text-xs text-bad">{t("requiredFields")}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-line text-sm hover:bg-hover transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
