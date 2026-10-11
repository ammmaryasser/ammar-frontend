"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useLang } from "@/contexts/LanguageContext";
import {useReferences} from "@/lib/reference";
import {getPart} from "@/services/partsService";
import ResourceState from "@/components/ui/ResourceState";
import { formatEGP } from "@/lib/format";
import { savePart } from "@/services/partsService";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1.5";

export default function PartFormModal(props) {
  return props.open ? <PartForm key={props.part?.id || "new"} {...props}/> : null;
}
function seedForm(part) {
  return part ? {...part, fitment: (part.fitment || []).join("\n")} :
    {oem: "", name: "", nameAr: "", brand: "", category: "", qty: 0, reorderAt: 2,
     location: "", cost: "", price: "", fitment: ""};
}
function PartForm({ open, part, onClose, onSaved }) {
  const { t, isAr } = useLang();
  const [form, setForm] = useState(() => seedForm(part));
  const [errors, setErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const refs = useReferences();
  const {brandNames, categoryOptions} = refs;

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
    setSaveError(null);
    try { const saved = await savePart(payload); onSaved(saved); }
    catch (e) { setSaveError(e); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={part ? t("editPart") : t("addPart")} wide>
      <ResourceState error={refs.error} retry={refs.reload}/>
      {saveError && <div role="alert" className="p-4 text-bad text-sm">
        {saveError.field ? `${saveError.field}: ` : ""}{saveError.message}
        {saveError.status === 409 && <button type="button" className="block underline mt-2" onClick={async () => {
          setSaving(true);
          try { const fresh = await getPart(part.id); if (!fresh) throw new Error("Part no longer exists");
            setForm(seedForm(fresh)); setSaveError(null); } catch(e) {setSaveError(e);} finally {setSaving(false);}
        }}>{isAr ? "إعادة التحميل واستبدال المسودة" : "Reload and replace draft"}</button>}
      </div>}
      <form onSubmit={onSubmit}>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("oemNo")} *</label>
            <input
              aria-label={t("oemNo")} data-testid="part-oem" aria-invalid={saveError?.field === "oem"} aria-describedby="part-error-oem"
              value={form.oem ?? ""}
              onChange={set("oem")}
              placeholder="34116794300"
              className={`${inputCls} font-mono ${errors && !form.oem?.trim() ? "border-bad" : ""}`}
            />
              {saveError?.field === "oem" && <p id="part-error-oem" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t("nameEn")} *</label>
            <input
              aria-label={t("nameEn")} data-testid="part-nameEn" aria-invalid={saveError?.field === "nameEn"} aria-describedby="part-error-nameEn"
              value={form.name ?? ""}
              onChange={set("name")}
              placeholder="Front Brake Pads Set"
              className={`${inputCls} ${errors && !form.name?.trim() ? "border-bad" : ""}`}
            />
              {saveError?.field === "nameEn" && <p id="part-error-nameEn" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t("nameAr")}</label>
            <input
              aria-label={t("nameAr")} data-testid="part-nameAr" aria-invalid={saveError?.field === "nameAr"} aria-describedby="part-error-nameAr"
              value={form.nameAr ?? ""}
              onChange={set("nameAr")}
              placeholder="طقم فحمات فرامل أمامي"
              className={inputCls}
            />
              {saveError?.field === "nameAr" && <p id="part-error-nameAr" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t("brand")} *</label>
            <select
              aria-label={t("brand")} data-testid="part-brand" aria-invalid={saveError?.field === "brand"} aria-describedby="part-error-brand"
              value={form.brand ?? ""}
              onChange={set("brand")}
              className={`${inputCls} ${errors && !form.brand ? "border-bad" : ""}`}
            >
              <option value="">—</option>
              {brandNames.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
              {saveError?.field === "brand" && <p id="part-error-brand" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t("category")} *</label>
            <select
              aria-label={t("category")} data-testid="part-category" aria-invalid={saveError?.field === "category"} aria-describedby="part-error-category"
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
              {saveError?.field === "category" && <p id="part-error-category" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t("location")}</label>
            <input
              aria-label={t("location")} data-testid="part-location" aria-invalid={saveError?.field === "location"} aria-describedby="part-error-location"
              value={form.location ?? ""}
              onChange={set("location")}
              placeholder="A2-04"
              className={`${inputCls} font-mono`}
            />
              {saveError?.field === "location" && <p id="part-error-location" className="text-bad text-xs">{saveError.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t("fitment")}</label>
            <textarea
              aria-label={t("fitment")} data-testid="part-fitment" aria-invalid={saveError?.field === "fitment"} aria-describedby="part-error-fitment"
              value={form.fitment ?? ""}
              onChange={set("fitment")}
              rows={2}
              placeholder={"3 Series F30 (2012–2019)\n4 Series F32 (2013–2020)"}
              className="w-full px-3 py-2 rounded-md bg-bg border border-line text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent resize-none"
            />
              {saveError?.field === "fitment" && <p id="part-error-fitment" className="text-bad text-xs">{saveError.message}</p>}
            <p className="text-[11px] text-muted mt-1">{t("fitmentHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("quantity")}</label>
              <input
                aria-label={t("quantity")} data-testid="part-quantity" aria-invalid={saveError?.field === "quantity"} aria-describedby="part-error-quantity"
              type="number"
                min="0"
                value={form.qty ?? ""}
                onChange={set("qty")}
                className={`${inputCls} font-mono`}
              />
              {saveError?.field === "quantity" && <p id="part-error-quantity" className="text-bad text-xs">{saveError.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t("reorderAt")}</label>
              <input
                aria-label={t("reorderAt")} data-testid="part-reorderAt" aria-invalid={saveError?.field === "reorderAt"} aria-describedby="part-error-reorderAt"
              type="number"
                min="0"
                value={form.reorderAt ?? ""}
                onChange={set("reorderAt")}
                className={`${inputCls} font-mono`}
              />
              {saveError?.field === "reorderAt" && <p id="part-error-reorderAt" className="text-bad text-xs">{saveError.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("cost")} (EGP)</label>
              <input
                aria-label={t("cost")} data-testid="part-cost" aria-invalid={saveError?.field === "cost"} aria-describedby="part-error-cost"
              type="number"
                min="0"
                value={form.cost ?? ""}
                onChange={set("cost")}
                className={`${inputCls} font-mono`}
              />
              {saveError?.field === "cost" && <p id="part-error-cost" className="text-bad text-xs">{saveError.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t("retail")} (EGP)</label>
              <input
                aria-label={t("retail")} data-testid="part-price" aria-invalid={saveError?.field === "price"} aria-describedby="part-error-price"
              type="number"
                min="0"
                value={form.price ?? ""}
                onChange={set("price")}
                className={`${inputCls} font-mono`}
              />
              {saveError?.field === "price" && <p id="part-error-price" className="text-bad text-xs">{saveError.message}</p>}
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
            disabled={saving || refs.loading || !!refs.error}
            className="h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
