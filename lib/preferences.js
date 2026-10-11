"use client";
import {useSyncExternalStore} from "react";
function subscribe(callback) {
  window.addEventListener("storage", callback); window.addEventListener("ay-preference", callback);
  return () => {window.removeEventListener("storage", callback); window.removeEventListener("ay-preference", callback);};
}
export function usePreference(key, fallback, choices) {
  const value = useSyncExternalStore(subscribe, () => {
    try {const saved = localStorage.getItem(key); return choices.includes(saved) ? saved : fallback;}
    catch {return fallback;}
  }, () => fallback);
  const set = next => {
    try {localStorage.setItem(key, choices.includes(next) ? next : fallback);} catch {return;}
    window.dispatchEvent(new Event("ay-preference"));
  };
  return [value, set];
}
