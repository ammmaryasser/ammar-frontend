// AMAR YASSER — API client (Phase 9)
// All services talk to the Spring Boot backend through here.
// - Session-cookie auth: every request sends credentials.
// - CSRF: double-submit — reads the XSRF-TOKEN cookie (fetching /api/auth/csrf
//   once if it is missing) and echoes it as X-XSRF-TOKEN on mutating requests.
// - Errors: non-2xx responses arrive in the contract envelope
//   { status, error, message, field } and are thrown as ApiError.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081";

export class ApiError extends Error {
  constructor(status, error, message, field) {
    super(message);
    this.status = status;
    this.error = error;
    this.field = field;
  }
}

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}

let csrfFetched = false;
async function csrfToken() {
  let token = readCookie("XSRF-TOKEN");
  if (!token && !csrfFetched) {
    csrfFetched = true;
    try {
      await fetch(`${BASE}/api/auth/csrf`, { credentials: "include" });
    } catch {
      /* backend down — the real request will surface the error */
    }
    token = readCookie("XSRF-TOKEN");
  }
  return token;
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (["POST", "PUT", "DELETE"].includes(method)) {
    const token = await csrfToken();
    if (token) headers["X-XSRF-TOKEN"] = token;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const e = data || {};
    throw new ApiError(res.status, e.error ?? "INTERNAL", e.message ?? res.statusText, e.field ?? null);
  }
  return data;
}

// ---- cached reference data (brands/categories) for id → name mapping ----
let brandsPromise = null;
let categoriesPromise = null;
export const loadBrands = () => (brandsPromise ??= api("/api/brands"));
export const loadCategories = () => (categoriesPromise ??= api("/api/categories"));
export function resetReferenceCache() {
  brandsPromise = null;
  categoriesPromise = null;
}

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

// Backend PartDto → the UI's Part VM (identical shape to the mock's toPartVM)
export function apiPartToVM(p, brand, category, categoryAr) {
  return {
    id: p.id,
    oem: p.oem,
    name: p.nameEn,
    nameAr: p.nameAr,
    brand,
    category,
    categoryAr: categoryAr ?? "",
    qty: p.quantity,
    reorderAt: p.reorderAt,
    location: p.location ?? "",
    cost: num(p.cost),
    price: num(p.price),
    fitment: p.fitment ?? [],
    priceHistory: (p.priceHistory ?? []).map((h) => ({ date: h.d, price: num(h.p) })),
    history: (p.stockLog ?? [])
      .map((h) => ({
        type: (h.type ?? "").toLowerCase(),
        qty: h.qty,
        date: h.date,
        ref: h.ref ?? "",
      }))
      .reverse(),
  };
}
