// Sales service — live API (Phase 9). Same exports/shapes as the mock.
import { api } from "@/lib/api";
import { toPartVM } from "@/lib/data";

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

export async function mapSale(s, customers) {
  const c = (customers ?? []).find((x) => x.id === s.customerId);
  return {
    id: s.id,
    date: s.date,
    customerId: s.customerId,
    customerName: c ? c.name : "—",
    customerPhone: c ? c.phone : "",
    customerCar: c ? c.car : "",
    status: s.status,
    itemsCount: (s.items ?? []).reduce((n, it) => n + it.qty, 0),
    total: (s.items ?? []).reduce((sum, it) => sum + it.qty * num(it.unitPrice), 0),
    profit: (s.items ?? []).reduce((sum, it) => sum + it.qty * (num(it.unitPrice) - num(it.unitCost)), 0),
    items: (s.items ?? []).map((it) => ({
      ...it,
      name: it.name ?? it.partId,
      nameAr: it.nameAr ?? "",
      oem: it.oem ?? "—",
    })),
  };
}

export async function getSales() {
  const [sales, customers] = await Promise.all([api("/api/sales"), api("/api/customers")]);
  return Promise.all(sales.map((s) => mapSale(s, customers)));
}

export async function getSaleById(id) {
  try {
    const [sale, customers] = await Promise.all([
      api(`/api/sales/${encodeURIComponent(id)}`),
      api("/api/customers"),
    ]);
    return mapSale(sale, customers);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function createSale({ customerId, items }) {
  // items: [{ partId, qty }] — the backend validates stock and snapshots prices.
  const sale = await api("/api/sales", { method: "POST", body: { customerId, items } });
  return mapSale(sale, []);
}

export { toPartVM };
