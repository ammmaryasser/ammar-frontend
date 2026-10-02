// Movements service — live API (Phase 9). Same exports/shapes as the mock.
import { api, loadBrands, loadCategories, apiPartToVM } from "@/lib/api";

async function withRefs(p) {
  const [brands, categories] = await Promise.all([loadBrands(), loadCategories()]);
  const brand = brands.find((b) => b.id === p.brandId)?.name ?? p.brandId;
  const cat = categories.find((c) => c.id === p.categoryId);
  return apiPartToVM(p, brand, cat?.nameEn ?? p.categoryId, cat?.nameAr ?? "");
}

// Same relative date labels as the mock's buildMovements
function relDateFactory(dates) {
  const unique = [...new Set(dates)].sort();
  const first = unique[unique.length - 1];
  const second = unique[unique.length - 2];
  return (d) => (d === first ? "today" : d === second ? "yesterday" : d.slice(5));
}

export async function getMovements() {
  const [movements, parts] = await Promise.all([api("/api/movements"), api("/api/parts")]);
  const byId = Object.fromEntries(parts.map((p) => [p.id, p]));
  const relDate = relDateFactory(movements.map((m) => m.date));
  return [...movements]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((m) => {
      const p = byId[m.partId];
      return {
        id: m.id,
        date: relDate(m.date),
        type: (m.type ?? "").toLowerCase(),
        qty: m.qty,
        ref: m.ref ?? "",
        name: p ? p.nameEn : m.partId,
        nameAr: p ? p.nameAr : "",
        part: p ? p.oem : "—",
      };
    });
}

export async function recordStockIn({ partId, qty, ref }) {
  const saved = await api("/api/movements/stock-in", {
    method: "POST",
    body: { partId, qty: Math.abs(qty), ref: ref || "stock-in" },
  });
  return withRefs(saved);
}

export async function recordAdjustment({ partId, delta, ref }) {
  // A below-zero delta arrives as 400 NEGATIVE_STOCK (ApiError) from the backend.
  const saved = await api("/api/movements/adjustments", {
    method: "POST",
    body: { partId, delta, ref: ref || "adjustment" },
  });
  return withRefs(saved);
}
