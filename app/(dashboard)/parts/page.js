"use client";
import {useResource} from "@/lib/useResource";
import ResourceState from "@/components/ui/ResourceState";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronDown,
  Pencil,
  PackageSearch,
  RotateCcw,
} from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatNum } from "@/lib/format";
import {stockStatus} from "@/lib/api";
import {useReferences} from "@/lib/reference";
import { getParts, deletePart } from "@/services/partsService";
import PartImage from "@/components/app/PartImage";
import StatusBadge from "@/components/app/StatusBadge";
import Pagination from "@/components/app/Pagination";
import PartFormModal from "@/components/app/PartFormModal";
import Modal from "@/components/ui/Modal";

const PAGE_SIZE = 12;

const selectCls =
  "h-9 ps-3 pe-8 rounded-md bg-surface border border-line text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer";

export default function PartsPage() {
  const { t, isAr } = useLang();
  const router = useRouter();

  const {data, loading, error, reload: load} = useResource(getParts);
  const parts = useMemo(() => data ?? [], [data]);
  const refs = useReferences();
  const {brandNames, categoryOptions} = refs;
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, part: null });
  const [confirmDel, setConfirmDel] = useState(null);


  const filtered = useMemo(
    () =>
      parts.filter((p) => {
        const needle = q.trim().toLowerCase();
        const matchQ =
          !needle ||
          p.oem.toLowerCase().includes(needle) ||
          p.name.toLowerCase().includes(needle) ||
          (p.nameAr || "").includes(q.trim()) ||
          p.brand.toLowerCase().includes(needle) ||
          (p.fitment || []).some((f) => f.toLowerCase().includes(needle));
        const matchB = !brand || p.brand === brand;
        const matchC = !category || p.category === category;
        const matchS = !status || stockStatus(p) === status;
        return matchQ && matchB && matchC && matchS;
      }),
    [parts, q, brand, category, status],
  );


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages);
  const current = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const hasFilters = q || brand || category || status;

  async function onDelete() {
    if (!confirmDel || deleting) return;
    setDeleteError(null); setDeleting(true);
    try { await deletePart(confirmDel.id); setConfirmDel(null); await load(); }
    catch (e) { setDeleteError(e); }
    finally {setDeleting(false);}
  }

  const clearFilters = () => {
    setPage(1);
    setQ("");
    setBrand("");
    setCategory("");
    setStatus("");
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      <ResourceState error={error || refs.error} retry={() => {load(); refs.reload();}}/>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("parts")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatNum(parts.length)} {t("items")}
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, part: null })}
          className="flex items-center gap-2 h-9 px-3.5 rounded-md bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} strokeWidth={2.2} />
          {t("addPart")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-line p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            strokeWidth={1.8}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => {setQ(e.target.value); setPage(1);}}
            placeholder={t("searchPlaceholder")}
            className="w-full h-9 ps-9 pe-3 rounded-md bg-bg border border-line text-sm placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div className="relative">
          <select value={brand} onChange={(e) => {setBrand(e.target.value); setPage(1);}} className={selectCls}>
            <option value="">{t("allBrands")}</option>
            {brandNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={category} onChange={(e) => {setCategory(e.target.value); setPage(1);}} className={selectCls}>
            <option value="">{t("allCategories")}</option>
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {isAr ? c.ar : c.en}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => {setStatus(e.target.value); setPage(1);}} className={selectCls}>
            <option value="">{t("allStatuses")}</option>
            <option value="ok">{t("inStock")}</option>
            <option value="low">{t("low")}</option>
            <option value="out">{t("outOfStock")}</option>
          </select>
          <ChevronDown size={14} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-line text-xs text-muted hover:bg-hover hover:text-ink transition-colors"
          >
            <RotateCcw size={13} />
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg">
                {[t("partNo"), t("part"), t("category"), t("qty"), t("location"), t("price"), t("status"), ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-[0.08em] ${
                        i === 0 || i === 1 || i === 2 ? "text-start" : "text-end"
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-4 py-3.5">
                        <div className="h-4 bg-hover rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : current.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/parts/${p.id}`)}
                      className="hover:bg-hover cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {p.oem}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PartImage className="w-9 h-9" iconSize={15} />
                          <div>
                            <div className="font-medium">
                              {isAr ? p.nameAr : p.name}
                            </div>
                            <div className="text-xs text-muted">
                              {p.brand} · {(p.fitment || [])[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                      {isAr && p.categoryAr ? p.categoryAr : p.category}
                    </td>
                      <td className="px-4 py-3 text-end">
                        <span className="font-mono">{p.qty}</span>
                        <span className="text-[11px] text-muted font-mono block">
                          {t("reorderAt")} {p.reorderAt}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end font-mono text-xs text-muted">
                        {p.location}
                      </td>
                      <td className="px-4 py-3 text-end font-mono">
                        {formatNum(p.price)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <StatusBadge status={stockStatus(p)} t={t} />
                      </td>
                      <td className="px-2 py-3 text-end whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ open: true, part: p });
                          }}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted hover:bg-line/60 hover:text-ink transition-colors"
                          title={t("editPart")}
                        >
                          <Pencil size={13} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && current.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-3">
            <PackageSearch size={28} strokeWidth={1.5} className="text-muted" />
            <p className="text-sm text-muted">{t("noResults")}</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-accent font-medium hover:underline"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        )}

        {!loading && current.length > 0 && (
          <div className="border-t border-line">
            <Pagination
              page={visiblePage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPage={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PartFormModal
        open={modal.open}
        part={modal.part}
        onClose={() => setModal({ open: false, part: null })}
        onSaved={() => {
          setModal({ open: false, part: null });
          load();
        }}
      />
      <Modal
        open={!!confirmDel}
        onClose={() => {if (!deleting) {setConfirmDel(null);setDeleteError(null);}}}
        title={t("confirmDelete")}
      >
        <div className="p-5">
          <ResourceState error={deleteError}/>
          <p className="text-sm text-muted">{t("confirmDeleteMsg")}</p>
          {confirmDel && (
            <div className="mt-3 font-mono text-xs text-muted">
              {confirmDel.oem} · {isAr ? confirmDel.nameAr : confirmDel.name}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-line">
          <button
            disabled={deleting} onClick={() => {setConfirmDel(null);setDeleteError(null);}}
            className="h-9 px-4 rounded-md border border-line text-sm hover:bg-hover transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            disabled={deleting}
            onClick={onDelete}
            className="h-9 px-4 rounded-md bg-bad text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("deletePart")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
