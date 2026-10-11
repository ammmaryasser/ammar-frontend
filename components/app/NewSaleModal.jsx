"use client";
import {useResource} from "@/lib/useResource";
import ResourceState from "@/components/ui/ResourceState";
const loadSaleOptions = () => Promise.all([getParts(), getCustomers()]);

import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { getParts } from "@/services/partsService";
import { getCustomers, createCustomer } from "@/services/customersService";
import { createSale } from "@/services/salesService";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1.5";

export default function NewSaleModal(props) {return props.open ? <SaleForm {...props}/> : null;}
function SaleForm({open, onClose, onSaved}) {
  const { t, isAr } = useLang();
  const {data, loading, error: loadError, reload} = useResource(loadSaleOptions);
  const [parts, customers] = data ?? [[], []];
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState(false);
  const [cForm, setCForm] = useState({ name: "", phone: "", car: "" });
  const [items, setItems] = useState([{ partId: "", qty: 1 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);


  const inStock = useMemo(() => parts.filter((p) => p.qty > 0), [parts]);
  const partMap = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p])), [parts]);

  const total = items.reduce((sum, it) => {
    const p = partMap[it.partId];
    return sum + (p ? p.price * Number(it.qty || 0) : 0);
  }, 0);

  const setItem = (i, k, v) =>
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const valid = items.filter((it) => it.partId && it.qty > 0);
    if (!valid.length) {
      setError(t("saleNoItems"));
      return;
    }
    if (newCustomer && !cForm.name.trim()) {
      setError(t("customerNameRequired"));
      return;
    }
    setSaving(true);
    try {
      let cid = customerId || customers[0]?.id || "";
      if (newCustomer) {
        const c = await createCustomer(cForm);
        cid = c.id; setCustomerId(c.id); setNewCustomer(false);
      }
      await createSale({ customerId: cid, items: valid });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("newSale")} wide>
      <ResourceState loading={loading} error={loadError} retry={reload}/>
      <form onSubmit={onSubmit}>
        <div className="p-5 space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("customer")}</label>
              {newCustomer ? (
                <div className="space-y-2">
                  <input
                    value={cForm.name}
                    onChange={(e) => setCForm({ ...cForm, name: e.target.value })}
                    placeholder={t("customerName")}
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={cForm.phone}
                      onChange={(e) => setCForm({ ...cForm, phone: e.target.value })}
                      placeholder="01xx xxx xxxx"
                      className={`${inputCls} font-mono`}
                    />
                    <input
                      value={cForm.car}
                      onChange={(e) => setCForm({ ...cForm, car: e.target.value })}
                      placeholder={t("customerCar")}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : (
                <select aria-label={t("customer")} data-testid="sale-customer"
                  value={customerId || customers[0]?.id || ""}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputCls}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.car || c.phone}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setNewCustomer((v) => !v)}
                className="text-xs text-muted hover:text-accent transition-colors mt-1.5 font-medium"
              >
                {newCustomer ? t("pickExisting") : t("newCustomer")}
              </button>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-md border border-line bg-bg p-3">
                <div className="text-xs text-muted">{t("saleTotal")}</div>
                <div className="font-mono text-lg font-semibold mt-0.5">{formatEGP(total)}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className={labelCls}>{t("saleItems")}</label>
            <div className="space-y-2">
              {items.map((it, i) => {
                const p = partMap[it.partId];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={13}
                        className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                      />
                      <select aria-label={t("part")} data-testid={`sale-part-${i}`}
                        value={it.partId}
                        onChange={(e) => setItem(i, "partId", e.target.value)}
                        className={`${inputCls} ps-8`}
                      >
                        <option value="">{t("selectPart")}</option>
                        {inStock.map((p2) => (
                          <option key={p2.id} value={p2.id}>
                            {p2.oem} — {isAr && p2.nameAr ? p2.nameAr : p2.name} ({formatNum(p2.qty)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <input aria-label={t("quantity")} data-testid={`sale-qty-${i}`}
                      type="number"
                      min="1"
                      max={p ? p.qty : undefined}
                      value={it.qty}
                      onChange={(e) => setItem(i, "qty", Number(e.target.value))}
                      className="w-20 h-9 px-2 rounded-md bg-bg border border-line text-sm font-mono text-end focus:outline-none focus:border-accent"
                    />
                    <span className="w-24 text-end font-mono text-xs text-muted hidden sm:block">
                      {p ? formatNum(p.price * Number(it.qty || 0)) : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}
                      className="p-2 text-muted hover:text-bad transition-colors"
                      aria-label="remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setItems((arr) => [...arr, { partId: "", qty: 1 }])}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mt-2 font-medium"
            >
              <Plus size={13} />
              {t("addItem")}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-bad-bg text-bad text-xs font-medium px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
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
            disabled={saving || loading || !!loadError}
            className="h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? t("saving") : t("completeSale")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
