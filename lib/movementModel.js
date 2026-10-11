export function movementToVM(m, part) {
  return {id: m.id, date: m.date, type: String(m.t ?? "unknown").toLowerCase(),
    qty: m.q, ref: m.ref ?? "", name: part?.nameEn ?? m.partId,
    nameAr: part?.nameAr ?? "", part: part?.oem ?? "—"};
}
