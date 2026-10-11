# AMAR frontend

Next.js 16.3.8 / React 19, Node 24. Bilingual English/Arabic automotive parts, stock, sales, invoices, reports and shared shop settings. Runtime data comes from the Spring Boot API. See [API contract](docs/API_CONTRACT.md); the backend repository has the shared acceptance/operations scripts and implementation status.

## Development

```powershell
npm ci
# Copy .env.example to .env.local, keeping BACKEND_INTERNAL_URL=http://localhost:8081
npm run dev
```

Start the matching secured backend on port 8081. Open http://localhost:3000 and sign in with the existing owner credentials (fresh development backend fallback: amar-dev-2026). Changing backend APP_INITIAL_PASSWORD does not change an existing owner password. There are no hardcoded browser credentials.

Browser requests are relative /api calls. Next's server rewrite uses BACKEND_INTERNAL_URL; this is never exposed as a browser URL. Local default is http://localhost:8081 and container builds use http://app:8080. Rewrites are fixed at build time, so rebuild when the internal URL changes. Do not use NEXT_PUBLIC_API_BASE.

Login protects dashboard and print routes. Protected 401 expires the local session and returns to login using a validated local path; network errors remain retryable connectivity errors. CSRF initialization and reference requests recover after failure. Only CSRF_INVALID retries once; ambiguous failed writes never replay automatically. Old part drafts retain their data on 409 and require explicit reload. Invoice descriptions/brands come from immutable sale snapshots.

Settings and print identity are shared through /api/settings, including both taglines. Browser-saved legacy settings have an explicit preview/import; the local copy stays until server save succeeds and is retained afterward. Theme and language stay local preferences. No runtime mock-data imports are used.

## Verification

```powershell
npm test
npm run lint
npm run build
npx playwright install chromium
# From the backend repository, using both matching working trees:
./scripts/acceptance.ps1 -FrontendDirectory '../../ammar frontend'
```

Client tests cover signed/date mappings, safe return paths, failed CSRF/reference recovery, no automatic network replay, 401 events, version conflicts and invoice snapshots. Lint rules remain enabled. Playwright uses the real API/session/CSRF chain in an isolated PostgreSQL acceptance environment; do not point it at shop data. It covers login, protected print, stale draft recovery, stock, sale/invoice/report history, settings import and multiple browsers. Test ports are 15432 (Postgres), 18081 (backend), 13000 (frontend). Direct npm run test:e2e requires the isolated backend and E2E_OWNER_PASSWORD; Playwright builds/starts/stops its own frontend.

CI runs deterministic npm ci, tests, lint and production build on Node 24. Workflow dispatch takes the matching backend revision for full-stack verification with Java 21/Docker. Prefer immutable commit SHAs; configure a read-only CROSS_REPO_TOKEN secret if the sibling repository is private. Neither CI workflow deploys.

## Production

The Dockerfile creates a non-root standalone Next container. BACKEND_INTERNAL_URL is a build argument. /health is the container probe. The backend production Compose override builds this sibling checkout, exposes only frontend 127.0.0.1:3000 and keeps PostgreSQL/Spring Boot internal.

Configure a public HTTPS ingress that forwards the entire site to frontend, preserves Host/cookies, redirects HTTP and sets HSTS. Production backend cookies use Secure, root paths and SameSite=Lax; SESSION stays HttpOnly. Follow the backend README for environment variables, validated backups and isolated restoration. Release backend/frontend together because PUT part updates require matching revisions.

Local acceptance passed on 2026-10-09: 44 backend tests and every service coverage gate, 9 frontend client tests, all 7 Playwright checks (2 real authenticated workflows and 5 recovery checks), zero lint errors/warnings and production builds. Both container images and an isolated production HTTPS/proxy/cookie check pass, as do validated backup/restore and smoke exit checks. The shop database remains at V2 with existing accounts/backups preserved. No public deployment or data migration was performed. Real HTTPS hosting/secrets and coordinated remote CI remain release setup.

The backend scripts/production-check.ps1 checks the built production images behind a disposable local TLS ingress, using OpenSSL and port 13443. Its self-signed certificate bypass is restricted to that test. CI includes this check after building both matching images. Frontend production dependencies were patched to Next 16.3.8; production npm audit is clean. Remaining development-only lint glob advisories are documented in the backend implementation status.
