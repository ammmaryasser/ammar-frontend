// AMAR YASSER — view-model layer
// Maps the canonical db.js shape (what Spring Boot will return) into the shape
// the UI consumes. When the real API arrives, only this mapping changes.

import {
  parts as dbParts,
  brands,
  categories as dbCategories,
  sales as dbSales,
  movements as dbMovements,
} from "./db";

export const brandNames = brands.map((b) => b.name);
export const categories = dbCategories.map((c) => c.nameEn);
// Dropdown options with localized labels (value stays the canonical EN name)
export const categoryOptions = dbCategories.map((c) => ({
  value: c.nameEn,
  en: c.nameEn,
  ar: c.nameAr,
}));

const brandName = (id) => brands.find((b) => b.id === id)?.name ?? id;
const categoryName = (id) => dbCategories.find((c) => c.id === id)?.nameEn ?? id;

export function toPartVM(p) {
  return {
    id: p.id,
    oem: p.oem,
    name: p.nameEn,
    nameAr: p.nameAr,
    brand: brandName(p.brandId),
    category: categoryName(p.categoryId),
    categoryAr: dbCategories.find((c) => c.id === p.categoryId)?.nameAr ?? "",
    qty: p.quantity,
    reorderAt: p.reorderAt,
    location: p.location,
    cost: p.cost,
    price: p.price,
    fitment: p.fitment,
    priceHistory: (p.priceHistory || []).map((h) => ({ date: h.d, price: h.p })),
    history: (p.stockLog || [])
      .map((h) => ({ type: h.t.toLowerCase(), qty: h.q, date: h.d, ref: h.ref }))
      .reverse(),
  };
}

export function stockStatus(p) {
  if (p.qty === 0) return "out";
  if (p.qty <= p.reorderAt) return "low";
  return "ok";
}

export const parts = dbParts.map(toPartVM);

// Movements view-model: newest first, relative date labels
const dates = [...new Set(dbMovements.map((m) => m.date))].sort().reverse();
const relDate = (d) => (dates[0] === d ? "today" : dates[1] === d ? "yesterday" : d.slice(5));

export function buildMovements() {
  const sorted = [...dbMovements].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted.map((m) => {
    const part = dbParts.find((p) => p.id === m.partId);
    return {
      id: m.id,
      date: relDate(m.date),
      type: m.t.toLowerCase(),
      qty: m.q,
      ref: m.ref,
      name: part ? part.nameEn : m.partId,
      nameAr: part ? part.nameAr : "",
      part: part ? part.oem : "—",
    };
  });
}

export const movements = buildMovements();

// KPIs computed from the store (deltas are static placeholders until the API)
const today = dates[0];
const month = today.slice(0, 7);
const saleTotal = (s) => s.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
const saleProfit = (s) =>
  s.items.reduce((sum, it) => sum + it.qty * (it.unitPrice - it.unitCost), 0);
const todaySales = dbSales.filter((s) => s.date === today);

export const kpis = {
  partsOnHand: dbParts.reduce((sum, p) => sum + p.quantity, 0),
  stockValue: dbParts.reduce((sum, p) => sum + p.quantity * p.cost, 0),
  stockDelta: 2.4,
  todaysSales: todaySales.reduce((sum, s) => sum + saleTotal(s), 0),
  invoicesToday: todaySales.length,
  monthProfit: dbSales
    .filter((s) => s.date.startsWith(month))
    .reduce((sum, s) => sum + saleProfit(s), 0),
  profitDelta: 12.5,
  lowStock: dbParts.filter((p) => p.quantity <= p.reorderAt).length,
  critical: dbParts.filter((p) => p.quantity === 0).length,
};

export { dbCategories as categoryDefs, dbSales as sales, dbMovements as rawMovements };
