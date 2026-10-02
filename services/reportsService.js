// Reports service — aggregates sales into revenue/profit views.
// Phase 6: replace with fetch() to Spring Boot reporting endpoints.
import { parts as dbParts, brands, sales as dbSales } from "@/lib/db";

const brandName = (id) => brands.find((b) => b.id === id)?.name ?? id;
const partById = Object.fromEntries(dbParts.map((p) => [p.id, p]));

const itemTotal = (it) => it.qty * it.unitPrice;
const itemProfit = (it) => it.qty * (it.unitPrice - it.unitCost);
const saleTotal = (s) => s.items.reduce((sum, it) => sum + itemTotal(it), 0);
const saleProfit = (s) => s.items.reduce((sum, it) => sum + itemProfit(it), 0);

function shiftDays(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getReport(range = "month") {
  // Anchor "now" to the newest sale so mock data stays meaningful
  const dates = dbSales.map((s) => s.date).sort();
  const latest = dates[dates.length - 1] ?? shiftDays(new Date().toISOString().slice(0, 10), 0);

  let from = "0000-01-01";
  if (range === "month") from = latest.slice(0, 7) + "-01";
  else if (range === "30d") from = shiftDays(latest, -30);

  const inRange = dbSales.filter((s) => s.date >= from);
  const revenue = inRange.reduce((sum, s) => sum + saleTotal(s), 0);
  const profit = inRange.reduce((sum, s) => sum + saleProfit(s), 0);
  const units = inRange.reduce(
    (sum, s) => sum + s.items.reduce((n, it) => n + it.qty, 0),
    0,
  );

  // Monthly series (ascending) — revenue + profit per month
  const byMonth = new Map();
  for (const s of inRange) {
    const m = s.date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, { month: m, revenue: 0, profit: 0, invoices: 0 });
    const row = byMonth.get(m);
    row.revenue += saleTotal(s);
    row.profit += saleProfit(s);
    row.invoices += 1;
  }
  const monthly = [...byMonth.values()].sort((a, b) => (a.month < b.month ? -1 : 1));

  // Best sellers — by revenue
  const byPart = new Map();
  for (const s of inRange) {
    for (const it of s.items) {
      if (!byPart.has(it.partId)) byPart.set(it.partId, { qty: 0, revenue: 0, profit: 0 });
      const row = byPart.get(it.partId);
      row.qty += it.qty;
      row.revenue += itemTotal(it);
      row.profit += itemProfit(it);
    }
  }
  const bestSellers = [...byPart.entries()]
    .map(([partId, v]) => {
      const p = partById[partId];
      return {
        partId,
        name: p ? p.nameEn : partId,
        nameAr: p ? p.nameAr : "",
        oem: p ? p.oem : "—",
        brand: p ? brandName(p.brandId) : "—",
        ...v,
        margin: v.revenue ? Math.round((v.profit / v.revenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Brand breakdown — revenue share
  const byBrand = new Map();
  for (const s of inRange) {
    for (const it of s.items) {
      const p = partById[it.partId];
      const key = p ? p.brandId : "—";
      if (!byBrand.has(key)) byBrand.set(key, { units: 0, revenue: 0, profit: 0 });
      const row = byBrand.get(key);
      row.units += it.qty;
      row.revenue += itemTotal(it);
      row.profit += itemProfit(it);
    }
  }
  const brandRows = [...byBrand.entries()]
    .map(([id, v]) => ({
      brand: brandName(id),
      ...v,
      share: revenue ? Math.round((v.revenue / revenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    range,
    revenue,
    profit,
    units,
    invoices: inRange.length,
    avgMargin: revenue ? Math.round((profit / revenue) * 100) : 0,
    monthly,
    bestSellers,
    brands: brandRows,
  };
}
