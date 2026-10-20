# Architecture

```text
React PWA (mobile first)
  -> /api/v1 reverse proxy + authentication
  -> Java 21 / Spring Boot 4.0.8 service
       /domain (pure deterministic calculations)
       /application (commands, queries, validation)
       /infrastructure (JPA/EF Core, jobs, notifications)
       /web (controllers, DTO, OpenAPI)
  -> PostgreSQL 16 (single app database)
```

## Folder blueprint
```text
frontend/src/{app,pages,features,components,lib,styles,tests}
backend/{src,tests}
infra/{docker,ci,deploy}
docs/{adr,fixtures}
```

## Backend conventions
Java: Gradle, Spring Web, Spring Security, Spring Data JPA, Flyway, Bean Validation, JUnit5, Testcontainers.
C#: .NET 8+ LTS, ASP.NET Core Minimal API or Controllers, EF Core, FluentValidation equivalent, xUnit, Testcontainers.

## Privacy & auth
Use email/password + secure HttpOnly sameSite cookies or established OIDC provider. Protect resource queries by authenticated owner ID; no public account lookup. Rate limit authentication.

# Engineering and release requirements

- Launch market: Canada; UI English first, i18n hooks ready for fr-CA and zh-CN. Currency CAD default, locale en-CA, timezone America/Toronto configurable.
- Frontend: React 19 + TypeScript + Vite, React Router, TanStack Query, Tailwind CSS, React Hook Form + Zod, Recharts, Vitest, Playwright. Mobile-first responsive PWA, accessible keyboard navigation and contrast.
- Backend: isolated REST API, layered/hexagonal modules (domain, application, infrastructure, http), OpenAPI, JWT/session authentication with Argon2id/bcrypt, PostgreSQL 16 + database migrations, Docker Compose for dev.
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

