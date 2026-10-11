"use client";
import {useResource} from "@/lib/useResource";
import ResourceState from "@/components/ui/ResourceState";

import {useMemo} from "react";
import { useParams } from "next/navigation";
import PrintDocument from "@/components/app/PrintDocument";
import { useLang } from "@/contexts/LanguageContext";
import { getSaleById } from "@/services/salesService";

// Standalone print view — outside the dashboard chrome on purpose.
// /print/invoice/INV-2281 and /print/quote/INV-2281
export default function PrintDocPage() {
  const { type, id } = useParams();
  const { t } = useLang();
  const loader = useMemo(() => () => getSaleById(id), [id]);
  const {data: sale, loading, error, reload} = useResource(loader);
  if (error) return <ResourceState error={error} retry={reload}/>;

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
