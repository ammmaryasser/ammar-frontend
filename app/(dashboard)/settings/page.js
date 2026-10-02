"use client";

import { useEffect, useState } from "react";
import { Store, SlidersHorizontal, Globe, Info, Check } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getShopSettings, saveShopSettings } from "@/lib/settings";

const inputCls =
  "w-full h-9 px-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1.5";

export default function SettingsPage() {
  const { t, lang, set: setLang } = useLang();
  const { theme, set: setTheme } = useTheme();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(getShopSettings());
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  function onSave(e) {
    e.preventDefault();
    saveShopSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!form) return null;

  return (
    <div className="space-y-5 max-w-[820px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("settings")}</h1>
        <p className="text-sm text-muted mt-0.5">{t("settingsSub")}</p>
      </div>

      {/* Shop profile — feeds print documents */}
      <section className="bg-surface rounded-lg border border-line">
        <div className="flex items-center gap-2 p-5 pb-4">
          <Store size={15} className="text-accent" strokeWidth={2} />
          <h2 className="text-sm font-semibold">{t("shopProfile")}</h2>
        </div>
        <p className="px-5 pb-4 text-xs text-muted -mt-2">{t("shopProfileHint")}</p>
        <form onSubmit={onSave}>
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t("shopNameEn")}</label>
              <input value={form.shopNameEn} onChange={set("shopNameEn")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("shopNameAr")}</label>
              <input value={form.shopNameAr} onChange={set("shopNameAr")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("taglineEn")}</label>
              <input value={form.taglineEn} onChange={set("taglineEn")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("taglineAr")}</label>
              <input value={form.taglineAr} onChange={set("taglineAr")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("phone")}</label>
              <input value={form.phone} onChange={set("phone")} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>{t("address")}</label>
              <input value={form.addressEn} onChange={set("addressEn")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("addressAr")}</label>
              <input value={form.addressAr} onChange={set("addressAr")} className={inputCls} />
            </div>
            <div className="flex items-end justify-end sm:col-span-2">
              <button
                type="submit"
                className="flex items-center gap-2 h-9 px-4 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {saved ? <Check size={14} strokeWidth={2.4} /> : null}
                {saved ? t("saved") : t("save")}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Appearance */}
      <section className="bg-surface rounded-lg border border-line">
        <div className="flex items-center gap-2 p-5 pb-4">
          <SlidersHorizontal size={15} className="text-accent" strokeWidth={2} />
          <h2 className="text-sm font-semibold">{t("appearance")}</h2>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <ChoiceRow
            label={t("language")}
            value={lang}
            onChange={setLang}
            options={[["en", "English"], ["ar", "العربية"]]}
          />
          <ChoiceRow
            label={t("themeLabel")}
            value={theme}
            onChange={setTheme}
            options={[["light", t("lightMode")], ["dark", t("darkMode")]]}
          />
        </div>
      </section>

      {/* Region — fixed by business rules */}
      <section className="bg-surface rounded-lg border border-line">
        <div className="flex items-center gap-2 p-5 pb-4">
          <Globe size={15} className="text-accent" strokeWidth={2} />
          <h2 className="text-sm font-semibold">{t("region")}</h2>
        </div>
        <div className="px-5 pb-5 space-y-2.5 text-sm">
          <FactRow label={t("currencyLabel")} value="EGP (ج.م)" />
          <FactRow label={t("digitsLabel")} value={t("digitsValue")} />
          <FactRow label={t("docsLabel")} value={t("docsValue")} />
        </div>
      </section>

      {/* About */}
      <section className="bg-surface rounded-lg border border-line">
        <div className="flex items-center gap-2 p-5 pb-4">
          <Info size={15} className="text-accent" strokeWidth={2} />
          <h2 className="text-sm font-semibold">{t("about")}</h2>
        </div>
        <div className="px-5 pb-5 space-y-2.5 text-sm">
          <FactRow label={t("versionLabel")} value="1.0.0" mono />
          <FactRow label={t("backendLabel")} value={t("backendValue")} />
        </div>
      </section>
    </div>
  );
}

function ChoiceRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex rounded-md border border-line overflow-hidden">
        {options.map(([v, optLabel]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`h-8 px-3.5 text-xs font-medium transition-colors ${
              value === v ? "bg-ink text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function FactRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
