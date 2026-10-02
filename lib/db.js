// AMAR YASSER — mock database
// Single in-memory store shared across all mock services. Sales decrement stock
// and append movements, mirroring what the Spring Boot backend will do.
// Phase 6: replace service internals with fetch() calls — this file disappears.

export const brands = [
  { id: "bmw", name: "BMW" },
  { id: "mercedes", name: "Mercedes-Benz" },
  { id: "audi", name: "Audi" },
  { id: "volkswagen", name: "Volkswagen" },
  { id: "opel", name: "Opel" },
];

export const categories = [
  { id: "brakes", nameEn: "Brakes", nameAr: "الفرامل" },
  { id: "engine", nameEn: "Engine", nameAr: "المحرك" },
  { id: "suspension", nameEn: "Suspension", nameAr: "نظام التعليق" },
  { id: "electrical", nameEn: "Electrical", nameAr: "الكهرباء" },
  { id: "filters", nameEn: "Filters", nameAr: "الفلاتر" },
  { id: "cooling", nameEn: "Cooling", nameAr: "التبريد" },
  { id: "transmission", nameEn: "Transmission", nameAr: "ناقل الحركة" },
];

export const parts = [
  {
    id: "P-1001", oem: "34116794301", nameEn: "Front Brake Pads Set", nameAr: "طقم فحمات فرامل أمامية",
    brandId: "bmw", categoryId: "brakes",
    fitment: ["3 Series F30 (2012-2019)", "4 Series F32 (2014-2020)"],
    quantity: 14, reorderAt: 5, location: "A1-03",
    cost: 1150, price: 1850,
    priceHistory: [{ d: "2025-11-02", p: 1650 }, { d: "2026-02-14", p: 1750 }, { d: "2026-05-20", p: 1850 }],
    stockLog: [
      { d: "2026-05-20", t: "IN", q: 20, ref: "SHIP-118" },
      { d: "2026-06-11", t: "OUT", q: -4, ref: "INV-2201" },
      { d: "2026-07-02", t: "OUT", q: -2, ref: "INV-2245" },
    ],
  },
  {
    id: "P-1002", oem: "34116794302", nameEn: "Front Brake Discs Pair", nameAr: "زوج ديسك فرامل أمامي",
    brandId: "bmw", categoryId: "brakes",
    fitment: ["3 Series F30 (2012-2019)", "4 Series F32 (2014-2020)"],
    quantity: 3, reorderAt: 4, location: "A1-05",
    cost: 2400, price: 3900,
    priceHistory: [{ d: "2025-10-12", p: 3600 }, { d: "2026-04-01", p: 3900 }],
    stockLog: [
      { d: "2026-04-01", t: "IN", q: 10, ref: "SHIP-104" },
      { d: "2026-05-28", t: "OUT", q: -3, ref: "INV-2210" },
      { d: "2026-06-19", t: "OUT", q: -4, ref: "INV-2260" },
    ],
  },
  {
    id: "P-1003", oem: "11318607032", nameEn: "Oil Filter Housing Gasket", nameAr: "جوان علبة فلتر الزيت",
    brandId: "bmw", categoryId: "engine",
    fitment: ["1 Series F20", "2 Series F22", "3 Series F30"],
    quantity: 26, reorderAt: 8, location: "B2-11",
    cost: 220, price: 420,
    priceHistory: [{ d: "2025-09-05", p: 380 }, { d: "2026-03-10", p: 420 }],
    stockLog: [
      { d: "2026-03-10", t: "IN", q: 40, ref: "SHIP-095" },
      { d: "2026-06-02", t: "OUT", q: -8, ref: "INV-2225" },
      { d: "2026-06-02", t: "ADJ", q: -6, ref: "damage check" },
    ],
  },
  {
    id: "P-1004", oem: "31316785546", nameEn: "Front Shock Absorber", nameAr: "مساعد أمامي",
    brandId: "bmw", categoryId: "suspension",
    fitment: ["3 Series F30 (2012-2019)"],
    quantity: 0, reorderAt: 3, location: "C1-02",
    cost: 3900, price: 6400,
    priceHistory: [{ d: "2025-12-01", p: 6100 }, { d: "2026-05-15", p: 6400 }],
    stockLog: [
      { d: "2026-01-15", t: "IN", q: 8, ref: "SHIP-101" },
      { d: "2026-04-22", t: "OUT", q: -5, ref: "INV-2190" },
      { d: "2026-06-14", t: "OUT", q: -3, ref: "INV-2255" },
    ],
  },
  {
    id: "P-1005", oem: "63117260767", nameEn: "LED Headlight Unit Right", nameAr: "وحدة إضاءة LED يمنى",
    brandId: "bmw", categoryId: "electrical",
    fitment: ["5 Series G30 (2017-2023)"],
    quantity: 2, reorderAt: 2, location: "D3-01",
    cost: 18500, price: 27500,
    priceHistory: [{ d: "2026-01-20", p: 26000 }, { d: "2026-06-05", p: 27500 }],
    stockLog: [
      { d: "2026-01-20", t: "IN", q: 4, ref: "SHIP-102" },
      { d: "2026-05-30", t: "OUT", q: -2, ref: "INV-2232" },
    ],
  },
  {
    id: "P-2001", oem: "0004201104", nameEn: "Rear Brake Pads Set", nameAr: "طقم فحمات فرامل خلفية",
    brandId: "mercedes", categoryId: "brakes",
    fitment: ["C-Class W205 (2014-2021)", "E-Class W213 (2016-2023)"],
    quantity: 11, reorderAt: 5, location: "A2-04",
    cost: 980, price: 1650,
    priceHistory: [{ d: "2025-11-18", p: 1500 }, { d: "2026-04-28", p: 1650 }],
    stockLog: [
      { d: "2026-04-28", t: "IN", q: 18, ref: "SHIP-108" },
      { d: "2026-06-08", t: "OUT", q: -5, ref: "INV-2240" },
      { d: "2026-07-01", t: "OUT", q: -2, ref: "INV-2262" },
    ],
  },
  {
    id: "P-2002", oem: "2762000700", nameEn: "Spark Plugs Set (6pcs)", nameAr: "طقم بواجي (6 قطع)",
    brandId: "mercedes", categoryId: "engine",
    fitment: ["E-Class W212", "C-Class W204"],
    quantity: 19, reorderAt: 6, location: "B1-08",
    cost: 1450, price: 2300,
    priceHistory: [{ d: "2025-10-30", p: 2100 }, { d: "2026-05-10", p: 2300 }],
    stockLog: [
      { d: "2026-05-10", t: "IN", q: 25, ref: "SHIP-112" },
      { d: "2026-06-15", t: "OUT", q: -6, ref: "INV-2258" },
    ],
  },
  {
    id: "P-2003", oem: "2702000400", nameEn: "Timing Chain Kit", nameAr: "طقم سلسلة الكامات",
    brandId: "mercedes", categoryId: "engine",
    fitment: ["C-Class W204 (M271)"],
    quantity: 4, reorderAt: 2, location: "B3-06",
    cost: 8200, price: 12800,
    priceHistory: [{ d: "2026-02-08", p: 12000 }, { d: "2026-06-20", p: 12800 }],
    stockLog: [
      { d: "2026-02-08", t: "IN", q: 6, ref: "SHIP-110" },
      { d: "2026-05-19", t: "OUT", q: -2, ref: "INV-2218" },
    ],
  },
  {
    id: "P-2004", oem: "2123200638", nameEn: "Air Suspension Strut Front", nameAr: "مساعد هوائي أمامي",
    brandId: "mercedes", categoryId: "suspension",
    fitment: ["E-Class W212 (2010-2016)"],
    quantity: 1, reorderAt: 2, location: "C2-09",
    cost: 21500, price: 32000,
    priceHistory: [{ d: "2026-03-15", p: 30500 }, { d: "2026-06-25", p: 32000 }],
    stockLog: [
      { d: "2026-03-15", t: "IN", q: 3, ref: "SHIP-113" },
      { d: "2026-06-28", t: "OUT", q: -2, ref: "INV-2270" },
    ],
  },
  {
    id: "P-3001", oem: "8W0698151", nameEn: "Front Brake Pads Set", nameAr: "طقم فحمات فرامل أمامية",
    brandId: "audi", categoryId: "brakes",
    fitment: ["A4 B9 (2016-2023)", "A5 F5 (2017-2024)"],
    quantity: 9, reorderAt: 5, location: "A2-12",
    cost: 1250, price: 1980,
    priceHistory: [{ d: "2025-12-14", p: 1800 }, { d: "2026-05-25", p: 1980 }],
    stockLog: [
      { d: "2026-05-25", t: "IN", q: 15, ref: "SHIP-117" },
      { d: "2026-06-22", t: "OUT", q: -6, ref: "INV-2265" },
    ],
  },
  {
    id: "P-3002", oem: "06L115562", nameEn: "Oil Filter Cartridge", nameAr: "فلتر زيت",
    brandId: "audi", categoryId: "filters",
    fitment: ["A4 B9 2.0 TFSI", "A6 C8 2.0 TFSI"],
    quantity: 34, reorderAt: 10, location: "B1-02",
    cost: 130, price: 260,
    priceHistory: [{ d: "2025-08-20", p: 230 }, { d: "2026-04-15", p: 260 }],
    stockLog: [
      { d: "2026-04-15", t: "IN", q: 60, ref: "SHIP-107" },
      { d: "2026-06-05", t: "OUT", q: -14, ref: "INV-2228" },
      { d: "2026-07-03", t: "OUT", q: -12, ref: "INV-2268" },
    ],
  },
  {
    id: "P-3003", oem: "06K145702", nameEn: "Turbocharger Gasket Kit", nameAr: "طقم جوانات التيربو",
    brandId: "audi", categoryId: "engine",
    fitment: ["A4 B9 2.0 TFSI", "Q5 FY 2.0 TFSI"],
    quantity: 5, reorderAt: 3, location: "B4-03",
    cost: 1450, price: 2350,
    priceHistory: [{ d: "2026-02-20", p: 2200 }, { d: "2026-06-12", p: 2350 }],
    stockLog: [
      { d: "2026-02-20", t: "IN", q: 8, ref: "SHIP-111" },
      { d: "2026-05-11", t: "OUT", q: -3, ref: "INV-2212" },
    ],
  },
  {
    id: "P-3004", oem: "8W0955425", nameEn: "Wiper Blades Pair", nameAr: "زوج مساحات",
    brandId: "audi", categoryId: "electrical",
    fitment: ["A4 B9 (2016-2023)"],
    quantity: 16, reorderAt: 6, location: "E1-07",
    cost: 320, price: 580,
    priceHistory: [{ d: "2026-01-05", p: 540 }, { d: "2026-05-18", p: 580 }],
    stockLog: [
      { d: "2026-05-18", t: "IN", q: 24, ref: "SHIP-115" },
      { d: "2026-06-18", t: "OUT", q: -8, ref: "INV-2261" },
    ],
  },
  {
    id: "P-4001", oem: "5Q0698151", nameEn: "Front Brake Pads Set", nameAr: "طقم فحمات فرامل أمامية",
    brandId: "volkswagen", categoryId: "brakes",
    fitment: ["Golf 7 (2013-2020)", "Octavia 3 (2013-2020)"],
    quantity: 22, reorderAt: 8, location: "A3-01",
    cost: 850, price: 1450,
    priceHistory: [{ d: "2025-11-25", p: 1320 }, { d: "2026-04-20", p: 1450 }],
    stockLog: [
      { d: "2026-04-20", t: "IN", q: 35, ref: "SHIP-109" },
      { d: "2026-06-09", t: "OUT", q: -9, ref: "INV-2236" },
      { d: "2026-07-05", t: "OUT", q: -4, ref: "INV-2272" },
    ],
  },
  {
    id: "P-4002", oem: "04E115561H", nameEn: "Oil Filter", nameAr: "فلتر زيت",
    brandId: "volkswagen", categoryId: "filters",
    fitment: ["Golf 7 1.2/1.4 TSI", "Polo 6R 1.2 TSI"],
    quantity: 41, reorderAt: 12, location: "B1-05",
    cost: 95, price: 190,
    priceHistory: [{ d: "2025-09-15", p: 170 }, { d: "2026-04-08", p: 190 }],
    stockLog: [
      { d: "2026-04-08", t: "IN", q: 80, ref: "SHIP-106" },
      { d: "2026-06-01", t: "OUT", q: -22, ref: "INV-2220" },
      { d: "2026-07-01", t: "OUT", q: -17, ref: "INV-2266" },
    ],
  },
  {
    id: "P-4003", oem: "5Q0121245", nameEn: "Radiator Cooling Fan", nameAr: "مروحة تبريد",
    brandId: "volkswagen", categoryId: "cooling",
    fitment: ["Golf 7 1.4 TSI", "Octavia 3 1.4 TSI"],
    quantity: 0, reorderAt: 2, location: "D1-06",
    cost: 2900, price: 4600,
    priceHistory: [{ d: "2026-02-28", p: 4400 }, { d: "2026-06-15", p: 4600 }],
    stockLog: [
      { d: "2026-02-28", t: "IN", q: 4, ref: "SHIP-114" },
      { d: "2026-05-05", t: "OUT", q: -3, ref: "INV-2205" },
      { d: "2026-06-20", t: "OUT", q: -1, ref: "INV-2250" },
    ],
  },
  {
    id: "P-4004", oem: "6Q0423031", nameEn: "Clutch Master Cylinder", nameAr: "بانيو الطبنبة",
    brandId: "volkswagen", categoryId: "transmission",
    fitment: ["Polo 6R", "Ibiza 6J (manual)"],
    quantity: 6, reorderAt: 3, location: "B5-04",
    cost: 1150, price: 1900,
    priceHistory: [{ d: "2026-01-30", p: 1780 }, { d: "2026-05-22", p: 1900 }],
    stockLog: [
      { d: "2026-05-22", t: "IN", q: 9, ref: "SHIP-119" },
      { d: "2026-06-25", t: "OUT", q: -3, ref: "INV-2269" },
    ],
  },
  {
    id: "P-5001", oem: "1334155", nameEn: "Front Brake Pads Set", nameAr: "طقم فحمات فرامل أمامية",
    brandId: "opel", categoryId: "brakes",
    fitment: ["Astra J (2010-2015)", "Insignia A (2009-2017)"],
    quantity: 12, reorderAt: 5, location: "A3-09",
    cost: 640, price: 1120,
    priceHistory: [{ d: "2025-12-05", p: 1020 }, { d: "2026-04-25", p: 1120 }],
    stockLog: [
      { d: "2026-04-25", t: "IN", q: 20, ref: "SHIP-105" },
      { d: "2026-06-12", t: "OUT", q: -6, ref: "INV-2248" },
      { d: "2026-06-12", t: "ADJ", q: -2, ref: "box damage" },
    ],
  },
  {
    id: "P-5002", oem: "55564336", nameEn: "Timing Belt Kit", nameAr: "طقم سير كامل",
    brandId: "opel", categoryId: "engine",
    fitment: ["Astra J 1.4 Turbo", "Corsa D 1.4"],
    quantity: 8, reorderAt: 4, location: "B4-11",
    cost: 2100, price: 3350,
    priceHistory: [{ d: "2026-02-02", p: 3150 }, { d: "2026-06-08", p: 3350 }],
    stockLog: [
      { d: "2026-06-08", t: "IN", q: 12, ref: "SHIP-120" },
      { d: "2026-07-04", t: "OUT", q: -4, ref: "INV-2274" },
    ],
  },
  {
    id: "P-2005", oem: "2205001446", nameEn: "Lower Control Arm", nameAr: "ذراع سفلية",
    brandId: "mercedes", categoryId: "suspension",
    fitment: ["C-Class W205", "E-Class W213"],
    quantity: 7, reorderAt: 4, location: "C1-14",
    cost: 2600, price: 4100,
    priceHistory: [{ d: "2026-01-12", p: 3900 }, { d: "2026-05-02", p: 4100 }],
    stockLog: [
      { d: "2026-05-02", t: "IN", q: 10, ref: "SHIP-116" },
      { d: "2026-06-10", t: "OUT", q: -3, ref: "INV-2238" },
    ],
  },
];

// ---- Customers (B2C — individual car owners) ----

export const customers = [
  { id: "C-501", name: "Ahmed El-Sayed", phone: "0100 234 5678", car: "BMW 320i F30", notes: "" },
  { id: "C-502", name: "Mostafa Kamel", phone: "0111 987 6543", car: "Mercedes C180 W205", notes: "Prefers evening calls" },
  { id: "C-503", name: "Sara Adel", phone: "0122 456 7890", car: "Golf 7 1.4 TSI", notes: "" },
  { id: "C-504", name: "Hassan Ibrahim", phone: "0106 111 2233", car: "Audi A4 B9", notes: "Workshop owner — Qalyub" },
  { id: "C-505", name: "Omar Fathy", phone: "0128 777 8899", car: "Opel Astra J", notes: "" },
];

// ---- Sales (invoices) ----

export const sales = [
  {
    id: "INV-2272", date: "2026-07-05", customerId: "C-503", status: "PAID",
    items: [{ partId: "P-4001", qty: 4, unitPrice: 1450, unitCost: 850 }],
  },
  {
    id: "INV-2274", date: "2026-07-04", customerId: "C-501", status: "PAID",
    items: [{ partId: "P-5002", qty: 4, unitPrice: 3350, unitCost: 2100 }],
  },
  {
    id: "INV-2268", date: "2026-07-03", customerId: "C-504", status: "PENDING",
    items: [{ partId: "P-3002", qty: 12, unitPrice: 260, unitCost: 130 }],
  },
  {
    id: "INV-2245", date: "2026-07-02", customerId: "C-501", status: "PENDING",
    items: [{ partId: "P-1001", qty: 2, unitPrice: 1850, unitCost: 1150 }],
  },
  {
    id: "INV-2270", date: "2026-06-28", customerId: "C-502", status: "PAID",
    items: [{ partId: "P-2004", qty: 2, unitPrice: 32000, unitCost: 21500 }],
  },
  {
    id: "INV-2266", date: "2026-07-01", customerId: "C-505", status: "PAID",
    items: [{ partId: "P-4002", qty: 17, unitPrice: 190, unitCost: 95 }],
  },
  {
    id: "INV-2262", date: "2026-07-01", customerId: "C-502", status: "PAID",
    items: [{ partId: "P-2001", qty: 2, unitPrice: 1650, unitCost: 980 }],
  },
  {
    id: "INV-2250", date: "2026-06-20", customerId: "C-503", status: "PAID",
    items: [{ partId: "P-4003", qty: 1, unitPrice: 4600, unitCost: 2900 }],
  },
];

// ---- Movements (flat, newest first) ----

export const movements = [
  { id: "M-01", date: "2026-07-05", partId: "P-4001", t: "OUT", q: -4, ref: "INV-2272" },
  { id: "M-02", date: "2026-07-04", partId: "P-5002", t: "OUT", q: -4, ref: "INV-2274" },
  { id: "M-03", date: "2026-07-03", partId: "P-3002", t: "OUT", q: -12, ref: "INV-2268" },
  { id: "M-04", date: "2026-07-02", partId: "P-1001", t: "OUT", q: -2, ref: "INV-2245" },
  { id: "M-05", date: "2026-07-01", partId: "P-4002", t: "OUT", q: -17, ref: "INV-2266" },
  { id: "M-06", date: "2026-07-01", partId: "P-2001", t: "OUT", q: -2, ref: "INV-2262" },
  { id: "M-07", date: "2026-06-28", partId: "P-2004", t: "OUT", q: -2, ref: "INV-2270" },
  { id: "M-08", date: "2026-06-25", partId: "P-4004", t: "OUT", q: -3, ref: "INV-2269" },
  { id: "M-09", date: "2026-06-22", partId: "P-3001", t: "OUT", q: -6, ref: "INV-2265" },
  { id: "M-10", date: "2026-06-20", partId: "P-4003", t: "OUT", q: -1, ref: "INV-2250" },
  { id: "M-11", date: "2026-06-12", partId: "P-5001", t: "ADJ", q: -2, ref: "box damage" },
  { id: "M-12", date: "2026-06-10", partId: "P-2005", t: "OUT", q: -3, ref: "INV-2238" },
  { id: "M-13", date: "2026-06-08", partId: "P-5002", t: "IN", q: 12, ref: "SHIP-120" },
  { id: "M-14", date: "2026-06-08", partId: "P-2001", t: "OUT", q: -5, ref: "INV-2240" },
  { id: "M-15", date: "2026-06-05", partId: "P-3002", t: "OUT", q: -14, ref: "INV-2228" },
];

// ---- Helpers ----

let seq = 3000;
export const nextId = (prefix) => `${prefix}-${++seq}`;

export function recordMovement({ partId, t, q, ref }) {
  const today = new Date().toISOString().slice(0, 10);
  const m = { id: nextId("M"), date: today, partId, t, q: t === "IN" ? Math.abs(q) : -Math.abs(q), ref };
  movements.unshift(m);
  return m;
}

export function applyStock(part, delta, type, ref) {
  part.quantity += delta;
  part.stockLog.unshift({
    d: new Date().toISOString().slice(0, 10),
    t: type,
    q: delta,
    ref: ref || (type === "IN" ? "stock-in" : type === "ADJ" ? "adjustment" : "sale"),
  });
  recordMovement({ partId: part.id, t: type, q: delta, ref });
}
