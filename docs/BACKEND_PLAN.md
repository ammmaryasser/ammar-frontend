# AMAR YASSER — Backend Plan & Handoff Document

**Target stack:** Java 21 · Spring Boot 3.5.x · PostgreSQL 16 · Flyway · Maven
**Audience:** the backend developer/agent who will build this system.
**Companion document:** `docs/API_CONTRACT.md` (in the frontend repo) — the frontend's exact expectations. This plan expands it into a full implementation blueprint.

---

## 0. Project Context (read this first)

AMAR YASSER is an internal management system for a single-owner automotive spare-parts
importing agency in Egypt. The **frontend is already built and verified** (Next.js, JavaScript):

- Parts catalog with German-brand fitment (BMW, Mercedes, Audi, VW, Opel), bilingual EN/AR names
- Stock movements ledger (stock-in, sales decrement stock, manual adjustments)
- B2C walk-in sales with printable invoices (price/cost snapshotted per line at sale time)
- Customers, dashboard KPIs, monthly/best-seller/brand reports, print settings profile
- EGP-only money, Western digits only, ISO `yyyy-MM-dd` dates (no time component anywhere)

**Scale reality:** a few hundred parts, one user, internal tool. Every architectural choice
below is sized for *this* scale — correct, secure, fast, with zero enterprise theater.

### The Golden Rule

> `docs/API_CONTRACT.md` is law. Every endpoint path, JSON field name (`nameEn`,
> `reorderAt`, `unitCost`, `stockLog`…), and error code (`VALIDATION`,
> `INSUFFICIENT_STOCK`, `NEGATIVE_STOCK`, `NOT_FOUND`) must match it exactly.
> The frontend derives stock status client-side (`0 → out`, `≤ reorderAt → low`, else `ok`)
> and never parses IDs. Any deviation breaks the UI. The frontend's service layer
> (`services/*.js`) is a mock implementation of this contract; when the API lands, only
> those function bodies change to `fetch()` — pages and components never touch HTTP.

---

## 1. Stack & Versions (pin these)

| Component | Version | Notes |
|---|---|---|
| Java | 21 (LTS) | Enables virtual threads: `spring.threads.virtual.enabled=true` |
| Spring Boot | 3.5.x (latest patch) | Not 2.x; not Boot 4 |
| PostgreSQL | 16+ | `pg_trgm` extension for OEM fuzzy search |
| Flyway | bundled with Boot | Migrations only — **never** `ddl-auto: update` |
| Spring Data JPA / Hibernate | bundled | `ddl-auto: validate`, `open-in-view: false` |
| Spring Security | 6.x | Session-cookie auth (§8) |
| Spring Session JDBC | starter dep | Sessions in Postgres — survive restarts, revocable |
| springdoc-openapi | latest 2.x | `/swagger-ui.html`, dev profile only |
| Testcontainers | latest | Real Postgres for integration tests |
| ArchUnit + JaCoCo | latest | Boundary rules + coverage gate (≥ 80% on services) |
| Build tool | Maven | `spring-boot-starter-parent` POM |

**Starters/dependencies:** `web`, `data-jpa`, `security`, `validation`, `actuator`,
`flyway-core` + `flyway-database-postgresql`, `org.postgresql:postgresql` (runtime),
`spring-session-jdbc`, `springdoc-openapi-starter-webmvc-ui`, `bucket4j-core`,
`mapstruct` (optional — manual mappers are equally acceptable, see §2), and
`testcontainers` (`postgresql`, `junit-jupiter`, `spring-boot-test`) in test scope.

**Deliberately excluded:** Lombok `@Data` (allowed only as `@Getter/@Setter/@Builder`
on entities), microservice tooling, message brokers, Redis, OAuth2 — all unjustified
for a single-user internal app.

---

## 2. Architecture Decision Records

| # | Decision | Rationale |
|---|---|---|
| 1 | **Modular monolith, package-by-feature** — not hexagonal, not microservices | One user, one DB, one deployable. Each feature package holds its controller/service/repository/DTOs together. Boundaries enforced by ArchUnit tests (§3). Hexagonal ports/adapters would be ceremony without payoff here. |
| 2 | **Human-readable business keys as primary keys** | Part IDs `P-9001`, sale IDs `INV-2281`, customer IDs `C-601` — exactly the mock format the UI was built against. Generated from dedicated PostgreSQL sequences (`part_id_seq` starts at 9002, `sale_id_seq` at 2282, `customer_id_seq` at 602) so new IDs continue the mock numbering with zero collision risk. `TEXT` PKs are perfectly fine at this scale and make the frontend swap literally drop-in. |
| 3 | **Stock = counter + append-only ledger** | `part.quantity` is a maintained counter for fast reads; `stock_movements` is the immutable audit ledger. `CHECK (quantity >= 0)` makes oversell physically impossible even under an application bug. A nightly-consistency test asserts `quantity == ledger sum`. `Part.stockLog` in JSON is **projected from the ledger** (the part's movement rows, newest first) — there is no second table for it. |
| 4 | **Fitment as `TEXT[]` + GIN index** | Fitment entries are display/search strings ("3 Series F30 (2012–2019)"). A child table is needless ceremony at a few hundred parts. |
| 5 | **Bilingual columns `name_en` / `name_ar`** | Mirrors the data model the frontend already uses; never translate at the API layer. |
| 6 | **`NUMERIC(12,2)` → `BigDecimal`** | Never float/double for money. EGP-only, so no currency column (per contract). |
| 7 | **Hard part deletes keep history** | Contract: `DELETE /api/parts/{id}` → 204 and "server keeps movement history." Therefore `sale_items.part_id` and `stock_movements.part_id` are **intentional soft references** (no FK) so historical invoices/report rows survive part deletion. `price_history` uses a real FK with `ON DELETE CASCADE` (it has no value without the part). Report queries LEFT JOIN parts and fall back to stored values. |
| 8 | **Movement IDs are `BIGINT`** | The contract's StockMovement example is `{ "id": 42, ... }`; movement IDs are never displayed or parsed by the UI. Use `BIGINT GENERATED ALWAYS AS IDENTITY`. |
| 9 | **DTO records, plain entities** | Java records for all request/response DTOs (immutable, concise). Entities: no Lombok `@Data` (equals/hashCode + lazy-loading pitfalls); `@Getter/@Setter/@Builder` allowed. |
| 10 | **Mapping: manual mappers** | The DTO surface is small and shapes are stable; hand-written mapper classes (e.g. `PartMapper.toDto`) are explicit, debuggable, and dependency-free. MapStruct is acceptable if preferred — pick one style repo-wide. |
| 11 | **Central error envelope** | One `@RestControllerAdvice` produces the contract's `{status, error, message, field}` for every failure. Domain exceptions carry machine codes (`INSUFFICIENT_STOCK`, …). Controllers contain zero try/catch. |
| 12 | **Flyway migrations are immutable** | `V1__init.sql` full schema, `V2__seed_reference.sql` brands/categories/settings, `V3__seed_demo.sql` optional demo data. Never edit an applied migration — always add a new `V#`. |
| 13 | **Auth is additive, not blocking** | The contract marks auth out of scope (single owner). Spec'd in §8 as a self-contained phase that prefixes routes without changing any response shape, so the frontend swap can proceed with or without it. |

---

## 3. Project Structure (follow this exactly)

```
amar-backend/
├── pom.xml
├── Dockerfile                      # multi-stage: maven build → temurin-21-jre
├── docker-compose.yml              # postgres:16-alpine + app, healthchecks
├── .env.example                    # SPRING_DATASOURCE_*, PROFILE, secrets
└── src/
    ├── main/
    │   ├── java/com/amaryasser/amar/
    │   │   ├── AmarApplication.java
    │   │   ├── common/
    │   │   │   ├── api/            # ApiError record, GlobalExceptionHandler, ErrorCodes
    │   │   │   ├── config/         # SecurityConfig, CorsConfig, JacksonConfig,
    │   │   │   │                   # OpenApiConfig, CacheConfig, ClockConfig
    │   │   │   └── domain/         # NotFoundException, InsufficientStockException,
    │   │   │                       # NegativeStockException, DomainException (base)
    │   │   ├── auth/               # AuthController, AuthService, AppUser,
    │   │   │                       # AppUserRepository, LoginRequest, RateLimitFilter
    │   │   ├── reference/          # Brand, Category, ReferenceRepository,
    │   │   │                       # ReferenceController (GET /api/brands, /api/categories)
    │   │   ├── part/               # Part, PartRepository, PartService, PartController,
    │   │   │                       # PartMapper, PartDto, SavePartRequest,
    │   │   │                       # PriceHistoryEntry record
    │   │   ├── stock/              # StockMovement, StockMovementRepository,
    │   │   │                       # MovementService, MovementController,
    │   │   │                       # StockInRequest, AdjustmentRequest, MovementDto
    │   │   ├── sale/               # Sale, SaleItem, SaleRepository, SaleService,
    │   │   │                       # SaleController, SaleMapper, SaleDto, SaleItemDto,
    │   │   │                       # CreateSaleRequest, InvoiceNumberGenerator
    │   │   ├── customer/           # Customer, CustomerRepository, CustomerService,
    │   │   │                       # CustomerController, CustomerDto, SaveCustomerRequest
    │   │   ├── dashboard/          # DashboardController, DashboardService (KPI projections)
    │   │   ├── report/             # ReportController, ReportService,
    │   │   │                       # MonthlyRow, BestSellerRow, BrandRow (SQL projections)
    │   │   └── settings/           # ShopSettings, ShopSettingsRepository,
    │   │                           # SettingsController, SettingsService, SettingsDto
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       └── db/migration/
    │           ├── V1__init.sql
    │           ├── V2__seed_reference.sql
    │           └── V3__seed_demo.sql        # dev/demo only — see §5
    └── test/
        └── java/com/amaryasser/amar/
            ├── ArchitectureTest.java             # ArchUnit rules (below)
            ├── sale/CreateSaleIntegrationTest.java   # the critical one (§11)
            ├── stock/MovementIntegrationTest.java
            ├── part/PartApiIT.java
            ├── customer/CustomerApiIT.java
            ├── report/ReportIT.java
            └── support/PostgresContainer.java    # shared singleton container
```

**ArchUnit rules (`ArchitectureTest.java`) — build fails on violation:**

- No field injection anywhere (`@Autowired` on a field fails)
- Controllers may not touch repositories — services only
- `common/` may not depend on any feature package
- Feature packages may not import each other's internals; cross-feature calls go
  through the other feature's service class only
- No `java.util.Date` / `java.util.Calendar` — `java.time` only
- No `println` / swallowed exceptions (`catch (Exception e) {}`)

**Naming conventions:** entities singular (`Part`, `Sale`); tables plural snake_case
(`parts`, `sale_items`); DTOs suffixed (`PartDto`, `SavePartRequest`); repositories
`<Entity>Repository`; services `<Feature>Service`; one controller per REST resource.

---

## 4. Database Schema (PostgreSQL DDL — `V1__init.sql`)

Conventions: `snake_case` identifiers, plural table names, `TEXT` for human keys,
`NUMERIC(12,2)` for money, `DATE` for dates (no timestamps in this domain),
`timestamptz` only for audit columns. All DDL lives in `V1__init.sql`.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;          -- OEM fuzzy search

-- ID sequences (continue the mock numbering — see ADR #2)
CREATE SEQUENCE part_id_seq      START 9002;     -- → 'P-9002', 'P-9003', …
CREATE SEQUENCE sale_id_seq      START 2282;     -- → 'INV-2282', …
CREATE SEQUENCE customer_id_seq  START 602;      -- → 'C-602', …
CREATE SEQUENCE movement_id_seq  AS BIGINT;      -- used by IDENTITY instead

-- ── Reference data ─────────────────────────────────────────────
CREATE TABLE brands (
    id          TEXT PRIMARY KEY,                 -- 'bmw', 'mercedes'
    name        TEXT NOT NULL,
    models      TEXT[] NOT NULL DEFAULT '{}'      -- contract example shows models;
);                                                -- empty array when unknown

CREATE TABLE categories (
    id          TEXT PRIMARY KEY,                 -- 'brakes', 'engine'
    name_en     TEXT NOT NULL,
    name_ar     TEXT NOT NULL
);

-- ── Parts ──────────────────────────────────────────────────────
CREATE TABLE parts (
    id          TEXT PRIMARY KEY,                 -- 'P-9001'
    oem         TEXT NOT NULL,
    name_en     TEXT NOT NULL,
    name_ar     TEXT NOT NULL,
    brand_id    TEXT NOT NULL REFERENCES brands (id),
    category_id TEXT NOT NULL REFERENCES categories (id),
    fitment     TEXT[] NOT NULL DEFAULT '{}',     -- display strings, ADR #4
    quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),   -- ADR #3
    reorder_at  INTEGER NOT NULL DEFAULT 0 CHECK (reorder_at >= 0),
    location    TEXT NOT NULL DEFAULT '',
    cost        NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
    price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX parts_oem_uidx   ON parts (oem);
CREATE INDEX parts_brand_idx         ON parts (brand_id);
CREATE INDEX parts_category_idx      ON parts (category_id);
CREATE INDEX parts_name_en_trgm_idx  ON parts USING gin (name_en gin_trgm_ops);
CREATE INDEX parts_name_ar_trgm_idx  ON parts USING gin (name_ar gin_trgm_ops);
CREATE INDEX parts_oem_trgm_idx      ON parts USING gin (oem gin_trgm_ops);
CREATE INDEX parts_fitment_gin_idx   ON parts USING gin (fitment);

-- Price snapshot audit — serialized in Part JSON as priceHistory [{d, p}]
CREATE TABLE price_history (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    part_id     TEXT NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    price       NUMERIC(12,2) NOT NULL,
    changed_on  DATE NOT NULL,
    UNIQUE (part_id, changed_on)                  -- one entry per day; upsert on change
);
CREATE INDEX price_history_part_idx ON price_history (part_id, changed_on DESC);

-- Stock ledger — source of truth for both /api/movements AND Part.stockLog (ADR #3).
-- No FK to parts ON PURPOSE: history must survive part deletion (ADR #7).
CREATE TABLE stock_movements (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- JSON: 42
    part_id     TEXT NOT NULL,                    -- soft reference
    moved_on    DATE NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJ')),
    qty         INTEGER NOT NULL CHECK (qty <> 0),
    ref         TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
      (type = 'IN'  AND qty > 0) OR
      (type = 'OUT' AND qty < 0) OR
      (type = 'ADJ')                                  -- ADJ is signed either way
    )
);
CREATE INDEX stock_movements_part_idx ON stock_movements (part_id, moved_on DESC);
CREATE INDEX stock_movements_date_idx ON stock_movements (moved_on DESC);
CREATE INDEX stock_movements_ref_idx  ON stock_movements (ref);
```

**JSON serialization notes (server-side, single place — the mappers):**
- `Part.stockLog` = `stock_movements` rows for that part, **newest first**, as
  `{ "d": moved_on, "t": type, "q": qty, "ref": ref }` — exactly the mock's key names.
- `Part.priceHistory` = `price_history` rows ascending, as `{ "d": changed_on, "p": price }`.
- `fitment`, `models` serialize as JSON arrays (possibly empty — never `null`).
- All money fields serialize as JSON numbers (`1450`, `1850.50`) — never strings.

DDL continued:

```sql
-- ── Customers (B2C walk-in) ────────────────────────────────────
CREATE TABLE customers (
    id          TEXT PRIMARY KEY,                 -- 'C-601'
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    car         TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_name_idx ON customers (name);

-- ── Sales (invoices) ───────────────────────────────────────────
-- No FK to customers ON PURPOSE: customer rows may be cleaned up later;
-- the invoice keeps customerId as a historical string (contract: C-601).
CREATE TABLE sales (
    id          TEXT PRIMARY KEY,                 -- 'INV-2281'
    sale_date   DATE NOT NULL,
    customer_id TEXT NOT NULL,                    -- soft reference
    status      TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PENDING')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sales_date_idx     ON sales (sale_date DESC);
CREATE INDEX sales_customer_idx ON sales (customer_id);

-- Line items — unit_price/unit_cost are SNAPSHOTS at sale time (never updated
-- when the part's price/cost changes; this is what keeps historical profit true).
CREATE TABLE sale_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id     TEXT NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    part_id     TEXT NOT NULL,                    -- soft reference (ADR #7)
    qty         INTEGER NOT NULL CHECK (qty > 0),
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost   NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0)
);
CREATE INDEX sale_items_sale_idx ON sale_items (sale_id);
CREATE INDEX sale_items_part_idx ON sale_items (part_id);

-- ── Print/settings profile (shop identity on invoices & quotes) ──
CREATE TABLE shop_settings (
    id           INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- singleton row
    shop_name_en TEXT NOT NULL DEFAULT '',
    shop_name_ar TEXT NOT NULL DEFAULT '',
    phone        TEXT NOT NULL DEFAULT '',
    address_en   TEXT NOT NULL DEFAULT '',
    address_ar   TEXT NOT NULL DEFAULT '',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auth (§8 — additive phase) ─────────────────────────────────
CREATE TABLE app_users (
    username       TEXT PRIMARY KEY,
    password_hash  TEXT NOT NULL,                 -- BCrypt (strength 12)
    enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spring Session JDBC manages its own tables (spring_session.*)
-- via spring.session.jdbc.initialize-schema=always/embedded — do not hand-write them.
```

**Deletes & integrity summary:**

| Child | FK? | On part delete | On sale delete |
|---|---|---|---|
| `price_history` | yes | CASCADE | n/a |
| `stock_movements` | **no** (ADR #7) | row kept | n/a |
| `sale_items` | → sales only | row kept | CASCADE |
| `sales` | no FK to customers | n/a | n/a |

There is no "delete sale" endpoint in the contract — sales are immutable once created.
Part delete keeps every movement and sale item (204), matching the contract.

---

## 5. Flyway Migration Sequence

Files in `src/main/resources/db/migration/`, naming `V<version>__<description>.sql`
(double underscore). Boot auto-runs them on startup (`spring.flyway.enabled=true`).

| File | Contents | Applied when |
|---|---|---|
| `V1__init.sql` | Extensions, sequences, all tables, all indexes/check constraints (§4) | every environment |
| `V2__seed_reference.sql` | The 5 brands and 7 categories from `lib/db.js` (ids exactly `bmw`, `mercedes`, `audi`, `volkswagen`, `opel`; `brakes`, `engine`, `suspension`, `electrical`, `filters`, `cooling`, `transmission`), plus the singleton `shop_settings` row | every environment |
| `V3__seed_demo.sql` | Optional demo parts/customers/sales mirroring `lib/db.js` — **dev profile only** (`spring.flyway.locations` adds `classpath:db/demo` in dev, or gate with a `-- demo-only` guard: prefer a separate location `db/demo` so prod never sees it) | dev/demo |

Rules:
- **Never edit an applied migration.** Bug in V1? Ship `V4__fix_*.sql`.
- Every migration forward-only; no down-scripts (restore from backup instead).
- One logical change per migration; test each against a fresh Postgres 16 in CI.
- Hibernate never writes schema: `spring.jpa.hibernate.ddl-auto=validate` — a
  startup failure on mismatch is the safety net for schema drift.
- Demo seed uses the mock's exact IDs (`P-1001`…, `C-501`…, `INV-2272`…) and then
  bumps the sequences past the largest seeded ID (`setval('part_id_seq', 9020)`)
  so new IDs never collide with seeded ones.

---

## 6. API Implementation Notes (endpoint by endpoint)

Full path/shape reference: `docs/API_CONTRACT.md`. Notes here cover **behavior and
edge cases**; do not redefine the JSON. All endpoints return
`application/json; charset=UTF-8`; dates are ISO `yyyy-MM-dd`; errors use the
contract envelope (§7).

### 6.1 Reference data

- `GET /api/brands` → `[ { "id": "bmw", "name": "BMW", "models": [] }, … ]`
- `GET /api/categories` → `[ { "id": "brakes", "nameEn": "Brakes", "nameAr": "الفرامل" }, … ]`
- Cacheable (`@Cacheable("reference")`, evict on change; today there are no mutation
  endpoints — reference data is seeded). `models` may be `[]` if unknown; never `null`.

### 6.2 Dashboard — `GET /api/dashboard/summary`

One round-trip, computed in SQL (single `DashboardService` method, 2–3 queries):
`partsOnHand` = `SUM(quantity)`; `stockValue` = `SUM(quantity * cost)`;
`todaysSales` = sum of sale totals where `sale_date = CURRENT_DATE`;
`invoicesToday` = count of sales today; `monthProfit` =
`SUM((unit_price - unit_cost) * qty)` over `sale_items` joined to sales in the current
calendar month; `lowStock` = count of parts `quantity > 0 AND quantity <= reorder_at`;
`critical` = count of parts `quantity = 0`. Response has exactly the 7 contract keys —
no extras (the frontend computes deltas client-side).

### 6.3 Parts

| Endpoint | Behavior |
|---|---|
| `GET /api/parts` | All parts, newest first (mock order). Full `Part` JSON incl. `priceHistory` + `stockLog` (projected from `price_history` / `stock_movements`). Client-side search/filter for now; if the catalog grows, add `?q=&brand=&category=&status=&page=&size=` returning `{ "content": [...], "total": n }` — **agree with the frontend before implementing**. |
| `GET /api/parts/{id}` | 404 `NOT_FOUND` if missing. |
| `POST /api/parts` | `PartInput` (Part minus `id`, `priceHistory`, `stockLog`). Validate: all fields present, `brandId`/`categoryId` exist (else 400 `VALIDATION`, `field` set), `quantity >= 0`, `reorderAt >= 0`, `cost/price >= 0`, `oem` unique (409 or 400 — see note). ID = `'P-' || nextval('part_id_seq')`. An initial non-zero quantity writes an opening `IN` movement with `ref = 'opening'` so the ledger matches the counter. Seed `price_history` with the initial price. Return 201 + the full `Part`. |
| `PUT /api/parts/{id}` | Same validation. **If `quantity` differs from the stored value, append an `ADJ` movement server-side** with `q = new - old`, `ref = 'manual edit'` (contract requires this). If `price` changed, insert a `price_history` row (upsert by day). 404 if missing. |
| `DELETE /api/parts/{id}` | 204. Movements and sale items survive (ADR #7); price history cascades. |

OEM uniqueness: return `400 VALIDATION` with `field: "oem"` and message
"OEM already exists" — the frontend only distinguishes the four codes in §7.

**N+1 rule:** list endpoint must fetch parts + latest price history + log rows in
**3 queries total** (one per table, batched by part id), not one per part. At a few
hundred parts this is still instant; keep it clean anyway.

### 6.4 Movements

| Endpoint | Behavior |
|---|---|
| `GET /api/movements` | Ledger newest first (`moved_on DESC, id DESC`), as `{ "id": 42, "date": …, "partId": …, "t": …, "q": …, "ref": … }`. Sign convention is authoritative: `IN > 0`, `OUT < 0`, `ADJ` signed. |
| `POST /api/movements/stock-in` | Body `{ partId, qty, ref }`. 404 unknown part; 400 `VALIDATION` if `qty <= 0` (field `qty`). Transaction: `SELECT … FOR UPDATE` the part row → `quantity += qty` → insert `IN` movement (normalize `qty > 0`) → commit. Returns the **updated full `Part`** (contract), so the UI can refresh the row in place. |
| `POST /api/movements/adjustments` | Body `{ partId, delta, ref }`. `delta` signed, must be ≠ 0 (400). 400 `NEGATIVE_STOCK` if `quantity + delta < 0` — checked under the row lock. Same transactional pattern; returns updated `Part`. |

Both movement writes share one service method (`applyStock`) with the sale's stock
decrement — one code path for ledger + counter consistency (ADR #3).

### 6.5 Sales — the critical transaction

| Endpoint | Behavior |
|---|---|
| `GET /api/sales` | All sales, newest first (`sale_date DESC, id DESC`), items embedded. |
| `GET /api/sales/{id}` | Full sale; 404 `NOT_FOUND` if missing. |
| `POST /api/sales` | `CreateSale { customerId, items: [{ partId, qty }] }`. Returns 201 + full `Sale`. |

`POST /api/sales` — **one `@Transactional` method, all-or-nothing:**

1. Validate: `items` non-empty, every `qty > 0`; `customerId` may be an existing
   customer (mock always has one) or a walk-in sentinel — accept any non-empty
   string; only reject with 400 `VALIDATION` if `customerId` is blank/null.
2. `SELECT … FOR UPDATE` every referenced part row (sort the IDs first to make the
   lock order deterministic and prevent deadlocks).
3. For each item: part must exist (else 400 `VALIDATION`, `field: "items"`) and
   `quantity >= qty` (else **400 `INSUFFICIENT_STOCK`**, message like
   `Insufficient stock for P-9003 (2 left)` — the exact mock wording).
4. Decrement quantities; append `OUT` movements with `ref = <new sale id>`.
5. Snapshot `unitPrice = part.price`, `unitCost = part.cost` into `sale_items`
   (never re-read at display time).
6. ID = `'INV-' || nextval('sale_id_seq')`; persist sale with `status = 'PAID'`
   (status is display-only for now; walk-ins are PAID).

No endpoint mutates or deletes a sale — invoices are immutable (§4). Returns/cancellations
would be new endpoints added to the contract first, implemented as ADJ movements.

### 6.6 Customers

- `GET /api/customers` → all customers. Purchase counts/totals are computed
  client-side from `/api/sales` — the backend adds nothing.
- `POST /api/customers` → 201. Only `name` required (400 `VALIDATION`, `field: "name"`
  if blank); `phone`, `car`, `notes` optional, default `""` (never `null` in JSON).
  ID = `'C-' || nextval('customer_id_seq')`.

### 6.7 Reports (all take `from` & `to` as `yyyy-MM-dd`)

| Endpoint | SQL shape |
|---|---|
| `GET /api/reports/monthly` | One row per month in range (including empty months): `{ "month": "2026-07", "revenue": …, "profit": … }` where revenue = `SUM(unit_price * qty)`, profit = `SUM((unit_price - unit_cost) * qty)`, grouped by `date_trunc('month', sale_date)`. |
| `GET /api/reports/best-sellers` | Top 10 by qty desc: `{ "partId", "qty", "revenue", "profit" }`. Part names/OEMs are joined client-side (the catalog is already loaded) — do not add fields. |
| `GET /api/reports/brands` | `{ "brand": "BMW", "units": 44, "revenue": … }` joined through `parts.brand_id` → `brands.name`, sorted revenue desc. Deleted parts drop out of this join naturally — acceptable. |

Validate `from <= to` else 400 `VALIDATION`. Default (missing params): current month.

### 6.8 Settings (beyond the current contract — small addition)

The print pages render a shop profile (name EN/AR, phone, address) that the frontend
currently keeps locally. When the API lands:

- `GET /api/settings` → `{ "shopNameEn", "shopNameAr", "phone", "addressEn", "addressAr" }`
- `PUT /api/settings` → same shape (all optional strings; blank allowed), 200 + saved body.

Singleton row (`id = 1`, upsert). Flag this to the frontend swap: add
`services/settingsService.js` alongside the other swaps (§13).

---

## 7. Error Handling (the contract envelope)

One `@RestControllerAdvice` + one `ApiError` record. **Every** non-2xx response:

```json
{ "status": 400, "error": "INSUFFICIENT_STOCK", "message": "Insufficient stock for P-9003 (2 left)", "field": null }
```

| HTTP | `error` code | Raised by | `field` |
|---|---|---|---|
| 400 | `VALIDATION` | Bean Validation (`@Valid` failures), bad qty/delta, unknown brand/category, blank name | failing request field, e.g. `"qty"` |
| 400 | `INSUFFICIENT_STOCK` | sale item qty > part quantity | `null` |
| 400 | `NEGATIVE_STOCK` | adjustment result < 0 | `null` |
| 404 | `NOT_FOUND` | any unknown id | `null` |
| 500 | `INTERNAL` | anything unhandled | `null` |

Implementation notes:
- `DomainException(code, message, status)` base; `NotFoundException`,
  `InsufficientStockException`, `NegativeStockException` extend it.
- Map `MethodArgumentNotValidException` → first field error → `VALIDATION` + `field`.
- Map `HttpMessageNotReadableException` (malformed JSON) → 400 `VALIDATION`.
- Map `DataIntegrityViolationException` (e.g. OEM unique) → 400 `VALIDATION`.
- Log 500s with stack trace server-side; never leak stack traces in the body.
- Error responses must also be UTF-8 JSON (Arabic can appear in messages).

---

## 8. Security

Single-owner internal app behind a trusted network is still internet-facing in
practice — apply the OWASP baseline without over-engineering.

### 8.1 Session-cookie auth (recommended)

- `POST /api/auth/login` `{ "username", "password" }` → 204 + `HttpOnly` session cookie
  (`SESSION`), `Secure` in prod, `SameSite=Lax`. Wrong credentials → 401 with the
  contract envelope (`error: "UNAUTHORIZED"`) + generic message (no user-exists leak).
- `POST /api/auth/logout` → 204, invalidates the session (works — a real advantage
  over stateless JWT).
- `GET /api/auth/me` → `{ "username" }` for the frontend to check the session.
- Sessions stored in Postgres via **Spring Session JDBC** → survive restarts,
  revocable, and one less moving part than a token cache. Timeout: 12 h idle.
- Passwords: **BCrypt strength 12** (`PasswordEncoder`). Seed the owner's account via
  env var (`APP_INITIAL_PASSWORD`) on first boot — never committed to a migration.
- Brute force: `failed_attempts` / `locked_until` columns → lock 15 min after 5
  failures, plus a per-IP token-bucket rate limit (bucket4j filter: e.g. 10 login
  attempts/min, 300 API requests/min) returning 429.

### 8.2 CSRF

State-changing methods with cookie auth need CSRF protection: double-submit cookie
(`CookieCsrfTokenRepository.withHttpOnlyFalse()` + `XSRF-TOKEN` header), or Spring
Security's `CsrfTokenRequestAttributeHandler` (Boot 3.x default) — the frontend's
`lib/api.js` request helper (§13) reads the cookie and sets the header once.

### 8.3 Headers & CORS

- `Content-Security-Policy: default-src 'self'` (tighten per frontend needs)
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, HSTS when served over TLS.
- CORS: explicit allowlist of the Next.js origin(s) from config
  (`app.cors.allowed-origins`), `allowCredentials(true)` for the cookie — **never**
  `*` with credentials. Same-origin deployments need no CORS at all.
- `/actuator/**`: only `health` exposed in prod, no sensitive endpoints.

### 8.4 Route protection

```java
http.csrf(withDefaults())
    .cors(withDefaults())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/login", "/api/auth/logout").permitAll()
        .requestMatchers("/api/**").authenticated()
        .anyRequest().denyAll())
    .sessionManagement(s -> s.sessionCreationPolicy(SESSION));
```

Method-level checks are unnecessary for a single role today; if roles arrive,
use `@PreAuthorize` on services (not controllers).

### 8.5 JWT alternative (documented, not recommended)

If the team prefers stateless tokens: 15-min access token + rotating refresh token,
HS256 with a key from the environment, token in memory (never `localStorage`).
Tradeoffs: logout/revocation needs a denylist (state again), XSS token theft risk
moves to the client, and CSRF stops being a concern only if tokens never ride
cookies. For a one-user tool, the session cookie is simpler and safer.

---

## 9. Performance

| Concern | Approach |
|---|---|
| Connection pool | HikariCP defaults are fine; set `maximum-pool-size: 10` explicitly, `connection-timeout: 3s`. |
| N+1 | List endpoints batch-load children (§6.3); JPA `@EntityGraph` or 3 explicit queries. `open-in-view: false` — no lazy loads in web threads, ever. |
| Pagination | Not needed at a few hundred rows (contract: client-side filtering). Movements list is the one that grows — if it ever exceeds ~5k rows, add `?page&size` with keyset (`moved_on, id`) pagination; agree with the frontend first. |
| Locking | Row locks (`SELECT … FOR UPDATE`) only inside the short stock transactions; deterministic lock ordering (§6.5). No optimistic-retry loops needed at this scale. |
| Caching | `@Cacheable("reference")` for brands/categories (Caffeine, max 1 h). Dashboard/reports are cheap aggregates — no cache. |
| JSON | Jackson: `WRITE_DATES_AS_TIMESTAMPS` off; `Non-null` NOT set globally — the contract wants `""`/`[]`/explicit fields, and `field: null` in errors. Serialize dates as `yyyy-MM-dd` via `LocalDate` + `jackson-datatype-jsr310`. |
| JVM | Virtual threads on (`spring.threads.virtual.enabled=true`). Default GC; the app fits in a 512 MB container — set `-XX:MaxRAMPercentage=75`. |
| DB hygiene | `pg_trgm` GIN indexes power OEM/name search if the query param lands later; keep aggregate reports as SQL projections (§6.7), never stream entities. |

---

## 10. Configuration

### 10.1 `application.yml` (shared)

```yaml
spring:
  application.name: amar-backend
  threads.virtual.enabled: true
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/amar}
    username: ${SPRING_DATASOURCE_USERNAME:amar}
    password: ${SPRING_DATASOURCE_PASSWORD:amar}
    hikari:
      maximum-pool-size: 10
      connection-timeout: 3000
  jpa:
    hibernate.ddl-auto: validate      # Flyway owns the schema
    open-in-view: false
    properties.hibernate.jdbc.time_zone: UTC
  flyway:
    enabled: true
    locations: classpath:db/migration
  session:
    store-type: jdbc
    jdbc.initialize-schema: embedded
  jackson:
    serialization.write-dates-as-timestamps: false

app:
  cors.allowed-origins: ${APP_CORS_ALLOWED_ORIGINS:http://localhost:3000}

server:
  port: 8080
  servlet.encoding: { charset: UTF-8, force: true }
  shutdown: graceful

management:
  endpoints.web.exposure.include: health      # prod; add more in dev
  endpoint.health.liveness-state.enabled: true
```

### 10.2 Profiles

- **`dev`** (default): `springdoc` UI on, `DEBUG` logging for
  `org.hibernate.SQL` (parameter binding via `org.hibernate.orm.jdbc.bind`),
  Flyway demo location added (`classpath:db/demo`).
- **`prod`**: swagger off, `INFO` logging, only `/actuator/health` exposed,
  cookie `Secure=true`, strict CORS list, graceful shutdown + readiness probe.

Profiles are selected with `SPRING_PROFILES_ACTIVE`. Secrets only via environment /
Docker secrets — nothing sensitive in the repo.

### 10.3 `docker-compose.yml` (dev parity)

Two services: `db` (`postgres:16-alpine`, healthcheck `pg_isready`, named volume,
`POSTGRES_DB=amar`) and `app` (build `.`, depends_on db `condition: service_healthy`,
env from `.env`). Postgres data persists in `amar_pgdata` volume.

---

## 11. Testing Strategy

**Pyramid, bottom-heavy on real-DB integration tests** — the value here is in
transactional correctness, not in mocked unit tests:

| Layer | Tool | What to test |
|---|---|---|
| Integration (primary) | `@SpringBootTest` + Testcontainers **PostgreSQL 16** (singleton container in `support/PostgresContainer.java`, reused across test classes), `TestRestTemplate`/`MockMvc` against the real filter chain | Every endpoint's happy path + every error code in §7 |
| The critical test | `CreateSaleIntegrationTest` | Sale of 2 items: stock decremented, `OUT` movements written with `ref = saleId`, `unitPrice`/`unitCost` snapshotted, totals right; **second sale that overdraws → 400 `INSUFFICIENT_STOCK` and NOTHING changed** (rollback proof); concurrent sales race → no negative stock (DB `CHECK` + row locks) |
| Ledger consistency | test + optional nightly job | For every part: `quantity == SUM(signed movement qty)`; `stockLog` projection matches `/api/movements` rows |
| Adjustments | `MovementIntegrationTest` | stock-in normalizes sign; adjustment to negative → `NEGATIVE_STOCK`; `PUT` quantity edit appends `ADJ` row |
| Unit tests | plain JUnit 5 | Mappers (entity ↔ DTO ↔ JSON keys), ID generation, invoice total math, date-range validation |
| Web slice | `@WebMvcTest` + `@MockBean` services | Controller status codes, 400 envelope shape, `field` mapping |
| Architecture | ArchUnit (§3) | Injection, layering, no-`java.util.Date` rules |
| Migrations | Flyway + Testcontainers | Each migration applies cleanly to a **fresh** Postgres; `ddl-auto: validate` passes |
| Coverage gate | JaCoCo | ≥ 80% on service packages; mappers/DTOs excluded |

**Frontend-contract conformance test (required):** an integration test that asserts
the exact JSON keys of `Part`, `Sale`, `Customer`, `Brand`, `Category`, movement, and
the error envelope (`status`/`error`/`message`/`field`) — this is the guardrail that
keeps the swap drop-in. Run it in CI on every PR.

---

## 12. Build Order (phases — implement in this sequence)

| Phase | Deliverable | Done when |
|---|---|---|
| **B0** | Scaffold: Boot 3.5 app, docker-compose (db+app), Flyway `V1__init` + `V2__seed_reference`, `ddl-auto: validate` green, `/actuator/health` up | `docker compose up` serves health; brands/categories tables seeded |
| **B1** | Reference + Parts: `GET /brands`, `GET /categories`, full parts CRUD, error envelope | conformance test: Part JSON keys exactly match contract; CRUD + 404 + `VALIDATION` verified |
| **B2** | Movements: `GET /api/movements`, stock-in, adjustments — shared `applyStock` under row lock | ledger tests green; `NEGATIVE_STOCK` path verified; returns updated `Part` |
| **B3** | Sales: `POST /api/sales` transactional flow + `GET` list/detail | `CreateSaleIntegrationTest` green incl. rollback & concurrency proofs |
| **B4** | Customers, dashboard, reports, settings endpoints | shapes match §6.6–§6.8; monthly report fills empty months |
| **B5** | Security: session auth, CSRF, CORS allowlist, rate limiting, headers (§8) | unauthenticated `/api/**` → 401; login rate-limited; headers present |
| **B6** | Testing/CI: full test matrix (§11), ArchUnit, JaCoCo gate, contract-conformance test in CI | `mvn verify` green in CI |
| **B7** | Deploy: Dockerfile, prod profile, backups (`pg_dump` nightly cron), Actuator health | prod compose brings up the full stack; backup restores |

Each phase ends with a **contract check against `docs/API_CONTRACT.md`** — diff every
field name before moving on.

## 13. Frontend Swap (how the backend gets consumed)

The frontend's `services/*.js` are mock implementations of exactly these functions:

| File | Functions → endpoints |
|---|---|
| `partsService.js` | `getParts` → `GET /api/parts`; `getPart(id)` → `GET /api/parts/{id}`; `savePart` → `POST`/`PUT /api/parts`; `deletePart` → `DELETE /api/parts/{id}` |
| `movementsService.js` | `getMovements` → `GET /api/movements`; `recordStockIn` → `POST /api/movements/stock-in`; `recordAdjustment` → `POST /api/movements/adjustments` |
| `salesService.js` | `getSales` → `GET /api/sales`; `getSaleById` → `GET /api/sales/{id}`; `createSale` → `POST /api/sales` |
| `customersService.js` | `getCustomers` → `GET /api/customers`; `createCustomer` → `POST /api/customers` |
| `reportsService.js` | `getReport(range)` → the three `/api/reports/*` endpoints |
| *(new)* `settingsService.js` | `GET`/`PUT /api/settings` (§6.8) |

Planned swap (frontend-side, no backend action needed): introduce `lib/api.js` with a
`request(path, options)` helper — base URL from `NEXT_PUBLIC_API_BASE_URL`, JSON
headers, error normalization to the contract envelope — then replace mock bodies one
service file at a time. Pages/components never change. Backend checklist that makes
this drop-in:

- [ ] Every JSON key spelled exactly as the contract (`nameEn`, `nameAr`, `reorderAt`, `unitPrice`, `unitCost`, `priceHistory`, `stockLog`, `t`, `q`, `ref`, `d`, `p`)
- [ ] IDs as strings (`P-9001`, `INV-2281`, `C-601`); movement ids numeric
- [ ] Dates `yyyy-MM-dd`; money as JSON numbers; empty strings/arrays, never `null` (except error `field`)
- [ ] Error envelope exact; the 4 codes the frontend distinguishes (§7)
- [ ] Movement writes + sale creation return the updated/full objects the contract promises
- [ ] UTF-8 everywhere (Arabic names round-trip intact)
- [ ] CORS allowlist includes the Next.js origin; if auth lands, CSRF cookie flow documented for `lib/api.js`

## 14. Explicitly Out of Scope (do not build)

Multi-tenancy · roles/permissions beyond the single owner · refresh-token machinery ·
GraphQL · message queues · microservice split · image upload (future `POST /api/parts/{id}/photo`
multipart — contract already reserves it) · server-side pagination/search unless the
catalog outgrows the client (§6.3) · sale mutation/cancellation (needs a contract
change first, implemented as ADJ movements).

## 15. Acceptance Checklist (definition of done)

1. `docker compose up --build` → API + Postgres healthy; Flyway applied all migrations.
2. Contract conformance test green (exact JSON keys for every entity + error envelope).
3. `CreateSaleIntegrationTest` proves: snapshot pricing, decrement + `OUT` movements
   in one transaction, rollback on `INSUFFICIENT_STOCK`, no negative stock under concurrency.
4. Ledger/counter consistency test green; `PUT` quantity edits append `ADJ` rows.
5. All §7 error codes returned with correct HTTP status + `field` where applicable.
6. Part delete → 204; movements and sale items retained.
7. ArchUnit + JaCoCo (≥ 80% services) gates pass in CI.
8. Security phase: 401 on unauthenticated `/api/**`, login rate-limited, security
   headers present, CORS restricted to the configured origin.
9. `README.md` in the backend repo: run instructions, env vars, backup/restore.
10. Frontend swap performed service-by-service with zero UI code changes (§13).

---

*End of handoff. Questions about any shape decision → compare against
`docs/API_CONTRACT.md` first; it wins over this document where they overlap.*









