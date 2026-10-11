"use client";
import {api} from "./api";
import {useResource} from "./useResource";
export const SETTINGS_KEY = "ay-shop-settings";
export const getShopSettings = () => api("/api/settings");
export const saveShopSettings = next => api("/api/settings", {method: "PUT", body: next});
export function readLegacySettings() {
  if (typeof window === "undefined") return null;
  try { const value = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return Object.fromEntries(["shopNameEn","shopNameAr","phone","addressEn","addressAr","taglineEn","taglineAr"]
      .filter(k => typeof value[k] === "string").map(k => [k, value[k]]));
  } catch {return null;}
}
export function useShopSettings() {return useResource(getShopSettings);}
