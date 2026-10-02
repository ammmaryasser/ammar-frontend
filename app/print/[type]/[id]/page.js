"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PrintDocument from "@/components/app/PrintDocument";
import { useLang } from "@/contexts/LanguageContext";
import { getSaleById } from "@/services/salesService";

// Standalone print view — outside the dashboard chrome on purpose.
// /print/invoice/INV-2281 and /print/quote/INV-2281
export default function PrintDocPage() {
  const { type, id } = useParams();
  const { t } = useLang();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSaleById(id).then((s) => {
      setSale(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[820px] mx-auto py-10">
        <div className="h-96 rounded-md bg-hover animate-pulse" />
      </div>
    );
  }

  if (!sale || (type !== "invoice" && type !== "quote")) {
    return (
      <div className="max-w-[820px] mx-auto py-20 text-center text-sm text-muted">
        {t("docNotFound")}
      </div>
    );
  }

  return <PrintDocument type={type} sale={sale} />;
}
