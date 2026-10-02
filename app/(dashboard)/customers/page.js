"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Phone, Car, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useLang } from "@/contexts/LanguageContext";
import { formatEGP, formatNum } from "@/lib/format";
import { getCustomers, createCustomer } from "@/services/customersService";
import { getSales } from "@/services/salesService";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent";

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [cs, ss] = await Promise.all([getCustomers(), getSales()]);
    setCustomers(cs);
    setSales(ss);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.phone || "").includes(needle) ||
        (c.car || "").toLowerCase().includes(needle),
    );
  }, [customers, q]);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("customers")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatNum(customers.length)} {t("customersCount")}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} strokeWidth={2.2} />
          {t("addCustomer")}
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface rounded-lg border border-line p-3">
        <div className="relative">
          <Search
            size={15}
            strokeWidth={1.8}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchCustomers")}
            className="w-full h-9 ps-9 pe-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg border border-line p-5">
              <div className="h-4 bg-hover rounded animate-pulse w-1/2" />
              <div className="h-3 bg-hover rounded animate-pulse w-2/3 mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetail(c)}
              className="bg-surface rounded-lg border border-line p-5 text-start hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.name}</div>
                <div className="font-mono text-xs text-muted">{c.id}</div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="shrink-0" />
                    <span className="font-mono text-xs" dir="ltr">
                      {c.phone}
                    </span>
                  </div>
                )}
                {c.car && (
                  <div className="flex items-center gap-2">
                    <Car size={13} className="shrink-0" />
                    <span className="text-xs">{c.car}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                <span className="text-muted">
                  {formatNum(c.purchases)} {t("purchases")}
                </span>
                <span className="font-mono font-semibold">{formatEGP(c.spent)}</span>
              </div>
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full bg-surface rounded-lg border border-line py-10 text-center text-sm text-muted">
              {t("noResults")}
            </div>
          )}
        </div>
      )}

      {addOpen && (
        <AddCustomerModal
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}

      {detail && (
        <CustomerDetailModal
          customer={detail}
          sales={sales}
          t={t}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function InfoCell({ label, value, mono }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="text-[11px] text-muted uppercase tracking-[0.06em]">{label}</div>
      <div className={`text-sm font-semibold mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function CustomerDetailModal({ customer, sales, t, onClose }) {
  const mine = sales.filter((s) => s.customerId === customer.id);
  return (
    <Modal open onClose={onClose} title={customer.name}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoCell label={t("phone")} value={customer.phone || "—"} mono />
          <InfoCell label={t("customerCar")} value={customer.car || "—"} />
        </div>
        {customer.notes && (
          <p className="text-sm text-muted border border-line rounded-md p-3 bg-bg">
            {customer.notes}
          </p>
        )}
        <div>
          <h3 className="text-xs font-medium text-muted uppercase tracking-[0.08em] mb-2">
            {t("purchaseHistory")}
          </h3>
          <div className="border border-line rounded-md divide-y divide-line">
            {mine.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted">{s.id}</span>
                <span className="font-mono text-xs text-muted">{s.date}</span>
                <span className="font-mono font-semibold">{formatNum(s.total)}</span>
              </div>
            ))}
            {mine.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted">{t("noResults")}</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddCustomerModal({ onClose, onSaved }) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", car: "", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError(t("customerNameRequired"));
      return;
    }
    setSaving(true);
    try {
      await createCustomer(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("addCustomer")}>
      <form onSubmit={onSubmit}>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              {t("customerName")} *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t("phone")}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01xx xxx xxxx"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {t("customerCar")}
              </label>
              <input
                value={form.car}
                onChange={(e) => setForm({ ...form, car: e.target.value })}
                placeholder={t("customerCarPh")}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t("notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none"
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
