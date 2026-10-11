# AMAR API contract

Updated 2026-10-09. Backend and frontend must be released together: PUT part updates now require the revision returned by GET. This document is copied unchanged into the frontend docs directory.

Browser requests use relative `/api` paths. Next.js forwards them to `BACKEND_INTERNAL_URL` (local `http://localhost:8081`; Compose `http://app:8080`). Protected endpoints require the Spring `SESSION` cookie. All writes, including login/logout, echo the readable `XSRF-TOKEN` cookie in `X-XSRF-TOKEN`.

## Resources

| Endpoint | Result / write contract |
| --- | --- |
| GET /api/auth/csrf | `{headerName, parameterName, token}`; public and initializes CSRF cookie |
| POST /api/auth/login | `{username,password}` → `{username}`; rotates session |
| GET /api/auth/me | `{username}` or 401 |
| POST /api/auth/logout | 204 and revokes session |
| GET /api/brands | `[{id,name,models:[]}]` |
| GET /api/categories | `[{id,nameEn,nameAr}]` |
| GET /api/parts | Complete Part array |
| GET /api/parts/{id} | Part or 404 |
| POST /api/parts | PartInput → 201 Part; version optional on creation |
| PUT /api/parts/{id} | PartInput with required nonnegative `version` → 200 Part; stale version → 409 |
| DELETE /api/parts/{id} | 204; invoice and movement history survive |
| GET /api/movements | Complete array, newest business date then ID descending; no silent row limit |
| POST /api/movements/stock-in | `{partId,qty,ref?}` positive qty → 200 updated Part |
| POST /api/movements/adjustments | `{partId,delta,ref?}` signed nonzero delta → 200 updated Part |
| GET /api/customers | Complete Customer array |
| POST /api/customers | `{name,phone?,car?,notes?}` → 201 Customer |
| GET /api/sales | Complete Sale array, newest creation time then ID descending |
| GET /api/sales/{id} | Sale or 404 |
| POST /api/sales | `{customerId,items:[{partId,qty}]}` → 201 Sale; positive qty; duplicate parts aggregated |
| GET /api/dashboard/summary | `{partsOnHand,stockValue,todaysSales,invoicesToday,monthProfit,lowStock,critical}` |
| GET /api/settings | Settings singleton |
| PUT /api/settings | Partial Settings fields → 200 full Settings; unspecified fields retained |

Part: `{id,version,oem,nameEn,nameAr,brandId,categoryId,fitment:[],quantity,reorderAt,location,cost,price,priceHistory:[],stockLog:[]}`.

PartInput: `{version?,oem,nameEn,nameAr?,brand,category,fitment:[],quantity,reorderAt,location?,cost,price}`. Brand/category accept existing reference IDs or their names. `oem` and English name are required. Numeric stock/reorder/cost/price values are nonnegative. `version` is required for PUT; omit it for POST. Every successful change returns the current flushed revision. Stale updates leave stock, price and history unchanged; keep the draft and offer explicit reload instead of automatic retry.

Price history row: `{d,p}`. Part stock-log row: `{d,t,q,ref}`. Stock-log OUT uses a positive absolute `q` for this existing contract; the display converts it to a negative quantity. Movement row: `{id,date,partId,t,q,ref}` with signed q (IN positive, OUT negative, ADJ either). Dates are ISO calendar dates. Preserve backend ordering and show actual dates. Unrecognized types get a neutral icon/label.

Customer: `{id,name,phone,car,notes}`; optional strings serialize as blanks.

Sale: `{id,date,customerId,status,items:[]}`. Status is PAID or PENDING; new sales are PAID. Each item: `{partId,qty,unitPrice,unitCost,nameEn,nameAr,oem,brandId,brand}`. Item descriptions, OEM, brand and money are immutable sale-time snapshots. Financial totals derive from these items. The item keeps its part ID after catalog deletion. Part/sale money fields retain existing decimal-string serialization; report totals are JSON numbers. Currency is EGP.

Settings: `{shopNameEn,shopNameAr,phone,addressEn,addressAr,taglineEn,taglineAr}`; all strings. The API is authoritative across browsers. Browser legacy settings can be previewed and explicitly imported; no automatic import and the browser copy is kept. Theme/language remain local preferences.

## Reports

GET `/api/reports/overview?range=month|30d|all` returns:

```json
{"range":"month","from":"2026-10-01","to":"2026-10-09","revenue":0,"profit":0,"units":0,"invoices":0,"avgMargin":0,"monthly":[],"bestSellers":[],"brands":[]}
```

Dates are resolved once using the configured Cairo business clock. Month = month start through today. 30d = 30 calendar dates ending today. All = earliest sale through today; empty data starts today. Monthly rows are zero-filled across the selected interval: `{month:"YYYY-MM",revenue,profit}`. Sellers are top 10 by quantity: `{partId,name,nameAr,oem,brand,qty,revenue,profit,margin}`. Descriptions come from the latest invoice snapshot within the range; missing English name displays the retained part ID. Brand rows are `{brand,units,revenue,profit,share}` ordered by revenue. Percentage values are rounded integers and zero for zero revenue. Later catalog edits/deletion cannot move historical brand revenue.

Existing report endpoints remain available with `from` and `to` ISO dates; missing dates use the current business month (through month end):

- `/api/reports/monthly`: `[{month,revenue,profit}]`, zero-filled.
- `/api/reports/best-sellers`: `[{partId,qty,revenue,profit}]`, top 10 by quantity.
- `/api/reports/brands`: `[{brand,units,revenue}]`, snapshot grouping.
- `/api/reports/summary`: `{units,invoices,revenue,profit,avgMargin}`.

Invalid range/dates or from > to return 400 VALIDATION.

## Errors and authentication

Every error envelope is `{status,error,message,field}`; field may be null. Codes: 400 VALIDATION / INSUFFICIENT_STOCK / NEGATIVE_STOCK, 401 UNAUTHORIZED, 403 CSRF_INVALID / FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 429 RATE_LIMITED, 500 INTERNAL.

Only an explicit 403 CSRF_INVALID may trigger token refresh and one replay. Network-failed writes are never replayed automatically. Protected 401 clears user-specific caches and returns to login with a validated local return path. Connectivity failure is distinct from credential/session failure. CSRF and reference fetch promises recover after rejection.

Five consecutive bad passwords persistently lock the account for 15 minutes. Successful login resets failures. Concurrent failures serialize on the account row. Throttling is five attempts per minute per socket address/username; forwarded headers are ignored. The proxy address intentionally becomes the address key. Buckets expire after 10 idle minutes with a 10,000 entry bound. Session cookie: HttpOnly, SameSite=Lax, Path=/, Secure in prod. CSRF cookie: readable, SameSite=Lax, Path=/, Secure in prod.

## Migration limits

Flyway V1/V2 are unchanged. V3 adds part versions and sale-item descriptions/brands; V4 adds taglines. Existing invoices are backfilled from available catalog records at migration time. Earlier descriptions/brand assignments cannot always be recovered. For missing parts, descriptions/OEM/brand ID stay blank and brand is Unknown; financial snapshots and IDs are preserved. Take and validate a backup and isolated restore before running these migrations on the shop database.
