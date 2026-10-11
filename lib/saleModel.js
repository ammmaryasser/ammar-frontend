const num = (v) => (v === null || v === undefined ? 0 : Number(v));

export function mapSale(s, customers) {
  const c = (customers ?? []).find((x) => x.id === s.customerId);
  return {
    id: s.id,
    date: s.date,
    customerId: s.customerId,
    customerName: c ? c.name : "—",
    customerPhone: c ? c.phone : "",
    customerCar: c ? c.car : "",
    status: s.status,
    itemsCount: (s.items ?? []).reduce((n, it) => n + it.qty, 0),
    total: (s.items ?? []).reduce((sum, it) => sum + it.qty * num(it.unitPrice), 0),
    profit: (s.items ?? []).reduce((sum, it) => sum + it.qty * (num(it.unitPrice) - num(it.unitCost)), 0),
    items: (s.items ?? []).map((it) => ({
      ...it,
      name: it.nameEn || it.partId,
      nameAr: it.nameAr ?? "",
      oem: it.oem || "—",
    })),
  };
}
