// Shop settings — localStorage-backed, used by print documents and the settings page.
// When Spring Boot arrives this moves to a /api/settings endpoint.
"use client";

import { useEffect, useState } from "react";

const KEY = "ay-shop-settings";

export const defaultSettings = {
  shopNameEn: "Amar Yasser",
  shopNameAr: "عمار ياسر",
  taglineEn: "German Automotive Spare Parts — Egypt",
  taglineAr: "استيراد قطع غيار السيارات الألمانية — مصر",
  phone: "+20 100 000 0000",
  addressEn: "Cairo, Egypt",
  addressAr: "القاهرة، مصر",
};

export function getShopSettings() {
  if (typeof window === "undefined") return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaultSettings;
  }
}

export function saveShopSettings(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("ay-settings-changed"));
}

// Re-render consumers when settings change
export function useShopSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  useEffect(() => {
    const sync = () => setSettings(getShopSettings());
    sync();
    window.addEventListener("ay-settings-changed", sync);
    return () => window.removeEventListener("ay-settings-changed", sync);
  }, []);
  return settings;
}
