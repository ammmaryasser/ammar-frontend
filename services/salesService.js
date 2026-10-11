// Sales service — live API (Phase 9). Same exports/shapes as the mock.
import { api } from "@/lib/api";

import {mapSale} from "@/lib/saleModel";
export {mapSale} from "@/lib/saleModel";

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
