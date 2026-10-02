// Parts service — live API (Phase 9). Same exports/shapes as the mock.
import { api, loadBrands, loadCategories, apiPartToVM } from "@/lib/api";
import { stockStatus } from "@/lib/data";

async function withRefs(p) {
  const [brands, categories] = await Promise.all([loadBrands(), loadCategories()]);
  const brand = brands.find((b) => b.id === p.brandId)?.name ?? p.brandId;
  const cat = categories.find((c) => c.id === p.categoryId);
  return apiPartToVM(p, brand, cat?.nameEn ?? p.categoryId, cat?.nameAr ?? "");
}

export async function getParts() {
  const parts = await api("/api/parts");
  return Promise.all(parts.map(withRefs));
}

export async function getPart(id) {
  try {
    const p = await api(`/api/parts/${encodeURIComponent(id)}`);
    return withRefs(p);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function savePart(payload) {
  const body = {
    oem: payload.oem,
    nameEn: payload.name,
    nameAr: payload.nameAr || "",
    brand: payload.brand,
    category: payload.category,
    quantity: payload.qty,
    reorderAt: payload.reorderAt,
    location: payload.location,
    cost: payload.cost,
    price: payload.price,
    fitment: payload.fitment,
  };
  const saved = payload.id
    ? await api(`/api/parts/${encodeURIComponent(payload.id)}`, { method: "PUT", body })
    : await api("/api/parts", { method: "POST", body });
  return withRefs(saved);
}

export async function deletePart(id) {
  await api(`/api/parts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export { stockStatus };
