// Stock status pill — ok / low / out with semantic colors.
export default function StatusBadge({ status, t }) {
  if (status === "out")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-bad-bg text-bad">
        {t("outOfStock")}
      </span>
    );
  if (status === "low")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warn-bg text-warn">
        {t("low")}
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ok-bg text-ok">
      {t("inStock")}
    </span>
  );
}
