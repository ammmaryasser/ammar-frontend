# AMAR YASSER — Frontend ↔ Backend API Contract

Target backend: **Spring Boot (Java)**. This document defines every REST endpoint the
frontend needs, with exact JSON shapes. The frontend's service layer
(`services/*.js`) is a thin mock implementation of these functions — when the real
API exists, only those function bodies change to `fetch()` calls. Nothing in the
pages/components touches HTTP directly.

## Conventions

- **Base URL:** `/api` (configure via `NEXT_PUBLIC_API_BASE_URL`).
- **Content type:** `application/json; charset=UTF-8`.
- **Dates:** ISO `yyyy-MM-dd` (no time component anywhere in this app).
- **Money:** integers or decimals in **EGP**. No currency field — the app is EGP-only.
- **Numbers:** always Western digits in JSON.
- **IDs:** strings as shown in the mock data (`P-9001`, `INV-2281`, `C-601`).
  Spring may use longs/UUIDs — any string-safe ID works; the frontend never parses them.
- **Error format** (all non-2xx responses):

```json
{
  "status": 400,
  "error": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock for P-9003 (2 left)",
  "field": null
}
```

`field` is set only for validation errors (400) and names the request field that failed.

## Entities

These mirror `lib/db.js` — the single source of truth for the frontend's expectations.

**Part**

```json
{
  "id": "P-9001",
  "oem": "34116794300",
  "nameEn": "Front Brake Pads Set",
  "nameAr": "طقم فحمات فرامل أمامي",
  "brandId": "BMW",
  "categoryId": "brakes",
  "fitment": ["3 Series F30 (2012–2019)", "4 Series F32 (2013–2020)"],
  "quantity": 14,
  "reorderAt": 4,
  "location": "A1-03",
  "cost": 1450,
  "price": 2400,
  "priceHistory": [{ "d": "2026-07-01", "p": 2400 }],
  "stockLog": [{ "d": "2026-08-12", "t": "IN", "q": 20, "ref": "SHIP-121" }]
}
```

- `t` in `stockLog`: `"IN" | "OUT" | "ADJ"`; `q` is signed for ADJ, positive for IN/OUT.
- The frontend derives stock status client-side: `0 → out`, `≤ reorderAt → low`, else `ok`.

**Customer**

```json
{
  "id": "C-601",
  "name": "Mostafa Kamel",
  "phone": "01005551234",
  "car": "BMW 320i F30",
  "notes": ""
}
```

**Sale** (server computes totals; frontend recomputes defensively but trusts the server)

```json
{
  "id": "INV-2281",
  "date": "2026-09-05",
  "customerId": "C-601",
  "status": "PAID",
  "items": [
    { "partId": "P-9001", "qty": 2, "unitPrice": 2400, "unitCost": 1450 }
  ]
}
```

- `status`: `"PAID" | "PENDING"` — walk-in sales are recorded as PAID.
- `unitCost` is snapshotted at sale time so historical profit stays correct when costs change.

**Brand / Category** (reference data)

```json
{ "id": "BMW", "name": "BMW", "models": ["1 Series F20", "3 Series F30"] }
{ "id": "brakes", "nameEn": "Brakes", "nameAr": "الفرامل" }
```

## Endpoints

### Reference data

| Method | Path | Notes |
|---|---|---|
| GET | `/api/brands` | `Brand[]` |
| GET | `/api/categories` | `Category[]` |

### Dashboard

| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard/summary` | KPI block (see shape below) |

```json
{
  "partsOnHand": 1847,
  "stockValue": 214850,
  "todaysSales": 18200,
  "invoicesToday": 2,
  "monthProfit": 64200,
  "lowStock": 5,
  "critical": 1
}
```

(`stockDelta` / `profitDelta` percentages are computed client-side against the
reports endpoints; not required here.)

### Parts

| Method | Path | Body / Params | Returns |
|---|---|---|---|
| GET | `/api/parts` | — | `Part[]` |
| GET | `/api/parts/{id}` | — | `Part` (404 if missing) |
| POST | `/api/parts` | `PartInput` | `Part` (201) |
| PUT | `/api/parts/{id}` | `PartInput` | `Part` |
| DELETE | `/api/parts/{id}` | — | 204. Server keeps movement history. |

`PartInput` = `Part` without `id`, `priceHistory`, `stockLog`. Editing `quantity`
directly is allowed only for the owner's manual entry — it must also append an
`ADJ` row to `stockLog` server-side.

Search/filtering is done client-side for now (catalog is a few hundred parts).
If it grows: `GET /api/parts?q=&brand=&category=&status=&page=&size=` returning
`{ "content": Part[], "total": 250 }` — to be agreed before implementation.

### Movements

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/movements` | — | `StockMovement[]` (newest first) |
| POST | `/api/movements/stock-in` | `{ "partId": "P-9001", "qty": 10, "ref": "SHIP-121" }` | `Part` (updated) — 404 unknown part, 400 bad qty |
| POST | `/api/movements/adjustments` | `{ "partId": "P-9001", "delta": -2, "ref": "damaged box" }` | `Part` (updated) — 400 if result would be negative |

Both must be **transactional**: update `quantity`, append to `stockLog`, insert
`StockMovement` row, all or nothing.

### Sales

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/sales` | — | `Sale[]` (newest first) |
| GET | `/api/sales/{id}` | — | `Sale` (404 if missing) |
| POST | `/api/sales` | `CreateSale` (below) | `Sale` (201) |

`CreateSale`:

```json
{
  "customerId": "C-601",
  "items": [{ "partId": "P-9001", "qty": 2 }]
}
```

Server-side **in one transaction**:
1. Validate every part exists and `quantity >= qty` → else `400 INSUFFICIENT_STOCK`
   (must not partially apply).
2. Decrement quantities, append `OUT` rows to each part's `stockLog`, insert
   `StockMovement` rows with `ref = saleId`.
3. Snapshot `unitPrice`/`unitCost` from the part at sale time (price changes must
   not rewrite old invoices).
4. Persist sale with `status: "PAID"` (default; status is display-only for now).

  "items": [
    { "partId": "P-9001", "qty": 2, "unitPrice": 2400, "unitCost": 1450 }
  ]
}
```

**StockMovement** (write-only for the client except listing)

```json
{ "id": 42, "date": "2026-09-05", "partId": "P-9001", "t": "OUT", "q": -2, "ref": "INV-2281" }
```

### Customers

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/customers` | — | `Customer[]` |
| POST | `/api/customers` | `{ "name": "...", "phone": "...", "car": "...", "notes": "..." }` | `Customer` (201). Only `name` required. |

Purchase counts / totals per customer are computed client-side from `/api/sales`.

### Reports

| Method | Path | Params | Returns |
|---|---|---|---|
| GET | `/api/reports/monthly` | `from=yyyy-MM-dd&to=yyyy-MM-dd` | `[{ "month": "2026-07", "revenue": 182000, "profit": 61200 }]` (one row per month in range) |
| GET | `/api/reports/best-sellers` | `from&to` | Top 10: `{ "partId": "P-9001", "qty": 38, "revenue": 91200, "profit": 36100 }` |
| GET | `/api/reports/brands` | `from&to` | `[{ "brand": "BMW", "units": 44, "revenue": 128000 }]` (sorted desc) |

`partId` rows must be joined with part names/OEMs by the client (it already has
the catalog loaded).

## Error codes the frontend distinguishes

| HTTP | `error` | Frontend behavior |
|---|---|---|
| 400 | `VALIDATION` | Red field highlight (`field` names the input) |
| 400 | `INSUFFICIENT_STOCK` | Message shown in the New Sale / movement modal |
| 400 | `NEGATIVE_STOCK` | Shown in the adjustment modal |
| 404 | `NOT_FOUND` | "Not found" page/empty state |
| 500 | — | Generic error toast (to be added with the API) |

## Frontend service mapping

Each mock function → endpoint:

| Service file | Function | Endpoint |
|---|---|---|
| `partsService.js` | `getParts` / `getPart` / `savePart` / `deletePart` | Parts endpoints above |
| `movementsService.js` | `getMovements` / `recordStockIn` / `recordAdjustment` | Movements endpoints |
| `salesService.js` | `getSales` / `getSaleById` / `createSale` | Sales endpoints |
| `customersService.js` | `getCustomers` / `createCustomer` | Customers endpoints |
| `reportsService.js` | `getReport(range)` | `/api/reports/*` |

The planned swap: introduce `lib/api.js` with a `request(path, options)` helper
(base URL, JSON headers, error normalization) and replace mock bodies one file at
a time. UI code stays untouched.

## Deliberately out of scope

- **Authentication** — single-owner system; if needed later, add a session cookie
  or JWT and prefix all routes (contract shapes unchanged).
- **Image upload** — the part form has the upload tile stubbed; add
  `POST /api/parts/{id}/photo` (multipart) when the backend lands.
- **Pagination** — catalog is a few hundred parts; see the Parts note above.
