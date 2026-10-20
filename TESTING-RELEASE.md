# Quality gates and launch checklist

## Critical golden fixtures
Monthly due on Jan 31 => Feb 28 (non leap), Feb 29 (leap), Mar 31 by anchor policy; weekly across DST; recurring item paused; duplicate mark paid is idempotent; leap year yearly due; timezone switch preserves due LocalDate; cancel recurring leaves history unchanged.

## Testing pyramid
- Domain unit tests, property tests invariants, API integration with PostgreSQL Testcontainers, auth/ownership tests, Playwright E2E flows (onboarding, create, edit, compare, export, delete).
- Calculate deterministic expected outputs with hand-checked independent spreadsheet or reference before asserting.
- Accessibility: labels, tab flow, color contrast, readable 375px mobile; offline fallback.
- Performance: API p95 under 400ms at modest load for typical calculations; paginated tables; no N+1 data retrieval.

## Launch
# Engineering and release requirements

- Launch market: Canada; UI English first, i18n hooks ready for fr-CA and zh-CN. Currency CAD default, locale en-CA, timezone America/Toronto configurable.
- Frontend: React 19 + TypeScript + Vite, React Router, TanStack Query, Tailwind CSS, React Hook Form + Zod, Recharts, Vitest, Playwright. Mobile-first responsive PWA, accessible keyboard navigation and contrast.
- Backend: Java 21 / Spring Boot 4.0.8 (user-authorized security migration on 2026-10-20), isolated REST API, layered/hexagonal modules (domain, application, infrastructure, http), OpenAPI, JWT/session authentication with Argon2id/bcrypt, PostgreSQL 16 + database migrations, Docker Compose for dev.
- Logging: structured event logging with request id; never log credentials, tokens or sensitive financial contents. User owns their data. Per-user isolation at query layer, IDOR tests, request validation and rate limiting.
- Money: use decimal/BigDecimal; never floating point for financial balances. Always store input assumptions, units, version of calculators, and rounding method. Server is sole source of monetary projections.
- Dates: LocalDate for business due dates; UTC timestamps for events; never silently alter dates based on UTC conversions. Time-zone and DST acceptance tests.
- Exports and deletion: JSON/CSV export; user deletion endpoint with retention policy; privacy page, terms, disclaimers; no banking integrations or actual payments in MVP.
- Production-ready: automated tests; CI builds frontend/backend; lint/typecheck; dependency scan; migration validation; health checks; secret environment variables; encrypted transport; daily backup; rollback plan.

## Acceptance thresholds

- No critical/high security issues; no P0/P1 bugs; all unit, integration, and critical E2E tests pass.
- All calculations must have golden test fixtures manually reconciled to a documented reference example.
- App operates on 375px phone width, tablet and desktop; reduced-motion and screen-reader labels checked.
- Skeleton/loading, empty, error, offline, validation and success states designed and tested for every primary page.
- Monitoring, HTTPS, custom domain, privacy & terms, and production backup verified before public launch.

## Legal / risk communication
Personal planning estimates only; not individualized financial advice. Source and effective date of Canadian rules visible. Never represent screenshots/seed data as customer outcomes.
