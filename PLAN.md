# Amar Yasser — Spare Parts Management System
## Frontend Plan (Locked After Owner Interview)

> A management system for a German car spare-parts importing business in Egypt.
> This system manages the **products already in Egypt** (post-import): inventory, movements, sales, customers, and documents.

---

## 1. Interview Summary — Locked Requirements

| Decision | Owner's Answer |
|---|---|
| Users | **Owner only** (single user) — dense, fast, power-user UI. No role/permission system. |
| Language | **Bilingual Arabic/English with a toggle.** Numbers & technical terms always in English. Full RTL/LTR mirror layout. |
| Core job | **Manage parts already in Egypt** — NOT the import/customs journey. |
| Scope | Catalog + stock movements + sales + **low-stock alerts, price history, reorder hints**. |
| Customers | **B2C** — individual car owners, walk-in / direct orders. |
| Part organization | **Car brand/model fitment + OEM part number + category** (all three together). |
| Theme | **Light + dark toggle** (default: light). |
| Brand | Name only: **"Amar Yasser" (عمار ياسر)** — identity designed from scratch. |
| Devices | Desktop-first, **fully responsive** for phone use in the warehouse. |
| Currency | **EGP only** across the entire system. |
| Documents | **Printable invoices & quotations in Arabic AND English.** |
| Backend | **Spring Boot (Java), not started.** Frontend first with mock data; frontend defines the API contract. |
| Data scale | **A few hundred parts** — clean tables + pagination; no over-engineered search infra. |

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + JavaScript** | No TypeScript, per owner requirement. |
| Styling | **Tailwind CSS v4** | Design tokens via CSS variables. |
| Icons | **Lucide React** | One consistent stroke icon set. |
| State | React hooks + Context (theme, language) | No Redux — single user, modest complexity. |
| Data | `/services/*.js` mock layer → later swapped for REST calls to Spring Boot | Swapping touches only this layer. |
| Fonts | Identity-dependent (chosen in Phase 0) | Google Fonts, with system fallbacks. |

---

## 3. AI-Slop Design Rules (BANNED LIST)

The owner explicitly requires a non-AI-slop look. These patterns are **permanently banned**:

1. ❌ Purple-to-blue gradients as the dominant color device
2. ❌ Gradient text headlines, neon glows, glowing orbs, sparkle decorations
3. ❌ Glassmorphism everywhere (frosted glass cards on blurred backgrounds)
4. ❌ Emoji used as UI icons
5. ❌ Tailwind default blue (#3B82F6) as unexamined primary color
6. ❌ Inter/Roboto as the only font with zero typographic hierarchy
7. ❌ Excessive rounded corners (rounded-3xl everywhere), bloated padding
8. ❌ Cards inside cards inside cards; a card for every content piece
9. ❌ Fake stats / placeholder marketing copy
10. ❌ Purposeless floating animations; low-contrast gray-on-gray text

**Instead:** 1px borders over shadows, one disciplined accent color, real type scale, tight consistent spacing, crisp high-contrast text, information-dense scannable layouts, purposeful motion only.


---

## 4. Identity Directions (Phase 0 — Owner Picks One)

Four self-contained HTML mockups in `mockups/`, each showing the **same real screen** (inventory dashboard) so comparison is apples-to-apples:

1. **`german-engineering.html`** — graphite neutrals, industrial signal-yellow accent, mono numerals. Bosch/Siemens software feel.
2. **`premium-showroom.html`** — warm ivory + charcoal, champagne-gold accent, serif display. Mercedes-boutique restraint.
3. **`motorsport.html`** — white + racing-red accent, bold condensed numerals. BMW M vibe, executed minimally.
4. **`minimal-editorial.html`** — near-black on white, oversized typography, quiet luxury.

Each mockup shows: sidebar nav, topbar (search + AR toggle), KPI row, low-stock alerts, and a live parts table with status badges.

---

## 5. Screen & Module Map

### 5.1 Parts Catalog (the heart)
- Parts table: OEM part number, name, brand, category, photo, quantity, shelf location, cost & sell price (EGP), stock status
- Filters: car brand → model → year; category; stock status
- Part detail page: photos, fitment list, price history chart, movement log
- Add/Edit part form with image upload UI

### 5.2 Stock Movements
- Receive in / Sell out / Manual adjustment — quantity updates automatically
- Full audit trail per part (who/when/why — "who" is always the owner)

### 5.3 Sales & Customers (B2C)
- Quick "walk-in sale" flow (pick parts → quantity → price → done)
- Customer profiles: name, phone, purchase history
- Profit per part recorded at sale time

### 5.4 Dashboard & Alerts
- KPIs: stock value (EGP), today's sales, profit this month, low/out-of-stock count
- Low-stock thresholds per part → alert badges + reorder hints widget

### 5.5 Reports
- Sales history, profit per part, price history

### 5.6 Print Documents
- Invoice & quotation templates — Arabic and English versions, clean print CSS

---

## 6. Project Structure

```
ammar-frontend/
├── mockups/                  # Phase 0: identity mockups (HTML)
├── app/
│   ├── layout.js             # Root: theme + language providers
│   ├── (dashboard)/
│   │   ├── layout.js         # App shell: sidebar + topbar
│   │   ├── page.js           # Dashboard
│   │   ├── parts/
│   │   │   ├── page.js       # Catalog table
│   │   │   └── [id]/page.js  # Part detail
│   │   ├── movements/page.js
│   │   ├── sales/page.js
│   │   ├── customers/page.js
│   │   ├── reports/page.js
│   │   └── settings/page.js
│   └── print/
│       ├── invoice/[id]/page.js
│       └── quote/[id]/page.js
├── components/
│   ├── ui/                   # Primitives: Button, Input, Table, Badge, Modal, Toast…
│   └── app/                  # Composed: Sidebar, Topbar, KpiCard, PartsTable…
├── services/                 # Mock data layer → API contract for Spring Boot
│   ├── parts.js
│   ├── movements.js
│   ├── sales.js
│   └── customers.js
├── lib/                      # i18n dictionaries, formatters (EGP, dates), utils
├── contexts/                 # ThemeContext, LanguageContext
└── PLAN.md
```

---

## 7. Development Phases

| Phase | Deliverable | Status |
|---|---|---|
| **0** | 4 identity mockups → owner picks one | ✅ Done — **German Engineering locked in** |
| **1** | Next.js scaffold, design tokens, theme/lang system, app shell, UI primitives | ✅ Done — build passes, dev server verified |
| **2** | Parts catalog: table, filters, detail page, add/edit form | ✅ Done — build passes, all routes verified |
| **3** | Stock movements + walk-in sales + customers | ✅ Done — build passes, all routes verified |
| **4** | Dashboard, low-stock alerts, reorder hints, reports | ✅ Done — reports page (range chips, monthly chart, best sellers, brand breakdown), dashboard KPIs live since Phase 1 |
| **5** | Print documents (invoice/quote, AR + EN) | ✅ Done — `/print/invoice/[id]` & `/print/quote/[id]`, per-doc EN/AR switch, print CSS, build passes + live verified |
| **6** | Responsive polish + API contract doc for Spring Boot backend | ✅ Done — mobile bottom nav + responsive topbar, `docs/API_CONTRACT.md` (entities, endpoints, error codes, service mapping), full build passes (9 routes) |
| **7** | Backend handoff plan for Spring Boot | ✅ Done — `docs/BACKEND_PLAN.md`: architecture (modular monolith, package-by-feature), full PostgreSQL DDL + Flyway sequence, per-endpoint behavior notes, session-auth security design, performance, Testcontainers testing strategy, build order B0–B7, and the frontend swap checklist |

**All phases complete.** To connect the real backend: implement `docs/BACKEND_PLAN.md`
(phases B0–B7) — it expands `docs/API_CONTRACT.md` with exact DDL, behaviors, and an
acceptance checklist — then add `lib/api.js` and swap the mock bodies in
`services/*.js` one file at a time (plus a new `services/settingsService.js` for the
shop profile). No UI changes needed.

---

## 8. Key Design Decisions & Rationale

- **RTL from day one:** layout built with CSS logical properties (`margin-inline`, `padding-inline`) so Arabic mode is a true mirror, not an afterthought.
- **Numbers always in Western digits:** even in Arabic mode (owner requirement: "numbers/technical terms in English").
- **EGP formatting:** `EGP 12,500.00` style, consistent formatter in `lib/`.
- **Fitment data model:** a part has many fitments `{ brand, model, yearFrom, yearTo }`; filters drill brand → model.
- **Single-user shortcut:** no auth screens, no roles; settings page holds preferences (language, theme, low-stock defaults).
- **Mock-first services:** every service function documented as `GET/POST/PUT/DELETE /api/...` so the Spring Boot contract is derived directly from real usage.
