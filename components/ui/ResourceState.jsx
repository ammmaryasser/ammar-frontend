"use client";
import {useLang} from "@/contexts/LanguageContext";
export default function ResourceState({loading = false, error, retry, empty = false}) {
  const {isAr} = useLang();
  if (!loading && !error && !empty) return null;
  return <div role={error ? "alert" : "status"} className="rounded-lg border border-line p-5 text-sm space-y-3">
    <p>{loading ? (isAr ? "جارٍ التحميل…" : "Loading…") : error ?
      (isAr ? "تعذر تحميل البيانات. حاول مرة أخرى." : error.message) :
      (isAr ? "لا توجد بيانات بعد." : "No records yet.")}</p>
    {error && retry && <button onClick={retry} className="border border-line rounded px-3 py-2">
      {isAr ? "إعادة المحاولة" : "Retry"}</button>}
  </div>;
}
