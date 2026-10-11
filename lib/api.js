export class ApiError extends Error {
  constructor(status, error, message, field = null) {
    super(message); Object.assign(this, {status, error, field});
  }
}
let csrfPromise = null;
let brandsPromise = null;
let categoriesPromise = null;
let cacheEpoch = 0;
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split(/;\s*/).find(c => c.startsWith(name + "="));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}
export function resetReferenceCache() {
  cacheEpoch++; brandsPromise = null; categoriesPromise = null; csrfPromise = null;
}
async function csrfToken(force = false) {
  const token = !force && readCookie("XSRF-TOKEN");
  if (token) return token;
  if (!csrfPromise) {
    const pending = fetch("/api/auth/csrf", {credentials: "include", cache: "no-store"})
      .then(async res => {
        if (!res.ok) throw new ApiError(res.status, "CSRF_INVALID", "Could not initialize request protection");
        return (await res.json()).token;
      }).catch(error => {
        if (error instanceof ApiError) throw error;
        throw new ApiError(0, "NETWORK", "Unable to connect to the server. Please retry.");
      }).finally(() => { if (csrfPromise === pending) csrfPromise = null; });
    csrfPromise = pending;
  }
  return csrfPromise;
}
export async function api(path, {method = "GET", body, signal} = {}) {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  async function send(refresh = false) {
    const headers = {Accept: "application/json"};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (mutating) headers["X-XSRF-TOKEN"] = await csrfToken(refresh);
    let res;
    try { res = await fetch(path, {method, headers, signal, cache: "no-store",
      credentials: "include", body: body === undefined ? undefined : JSON.stringify(body)}); }
    catch (e) {
      if (e.name === "AbortError") throw e;
      throw new ApiError(0, "NETWORK", "Unable to connect to the server. Please retry.");
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 403 && data?.error === "CSRF_INVALID" && !refresh && mutating) return send(true);
      if (res.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/me") {
        resetReferenceCache();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("ay-session-expired"));
      }
      throw new ApiError(res.status, data?.error ?? "INTERNAL", data?.message ?? res.statusText, data?.field);
    }
    return data;
  }
  return send();
}
export function loadBrands() {
  if (!brandsPromise) {
    const epoch = cacheEpoch;
    brandsPromise = api("/api/brands").catch(e => { if (epoch === cacheEpoch) brandsPromise = null; throw e; });
  }
  return brandsPromise;
}
export function loadCategories() {
  if (!categoriesPromise) {
    const epoch = cacheEpoch;
    categoriesPromise = api("/api/categories").catch(e => { if (epoch === cacheEpoch) categoriesPromise = null; throw e; });
  }
  return categoriesPromise;
}
export function stockStatus(p) { return p.qty === 0 ? "out" : p.qty <= p.reorderAt ? "low" : "ok"; }
export function apiPartToVM(p, brand, category, categoryAr) {
  return {id: p.id, version: p.version, oem: p.oem, name: p.nameEn, nameAr: p.nameAr,
    brand, category, categoryAr: categoryAr ?? "", qty: p.quantity, reorderAt: p.reorderAt,
    location: p.location ?? "", cost: Number(p.cost ?? 0), price: Number(p.price ?? 0), fitment: p.fitment ?? [],
    priceHistory: (p.priceHistory ?? []).map(h => ({date: h.d, price: Number(h.p)})),
    history: (p.stockLog ?? []).map(h => ({type: String(h.t ?? "unknown").toLowerCase(),
      qty: h.t === "OUT" ? -Math.abs(h.q) : h.q, date: h.d, ref: h.ref ?? ""}))};
}
export function safeReturnPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)
      || value.startsWith("/login")) return "/";
  try { const url = new URL(value, "https://local.invalid");
    return url.origin === "https://local.invalid" ? url.pathname + url.search + url.hash : "/";
  } catch { return "/"; }
}
