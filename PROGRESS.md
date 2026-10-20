# Progress log

## T12 — follow-up 2026-10-19; BLOCKED on Chrome access and proxy runtime
- Re-read project instructions and status. The previously selected Chrome browser is unavailable and browser inventory is empty. Native Chrome access was explicitly not approved; no bypass attempted. No browser UI test was performed in this follow-up.
- Read-only HTTP recheck: `127.0.0.1:5173/api/v1/auth/me` still returns empty 500; `127.0.0.1:8080/health` returns 200/UP. Frontend restart and Chrome connection/approval remain required. T12 remains unchecked.

## T12 — Chrome retest 2026-10-19; BLOCKED on development server restart
- Chrome access now works. Opened http://127.0.0.1:5173 and confirmed the visible “We couldn’t load this” error state; business flows could not start.
- HTTP evidence: frontend `/api/v1/auth/me` returns empty 500; direct `localhost:8080/api/v1/auth/me` returns empty 500, while `127.0.0.1:8080/api/v1/auth/me` returns the expected JSON 401 and IPv4 `/health` returns UP.
- Changed Vite `/api` and `/health` proxy targets to explicit `127.0.0.1:8080`. The existing 5173 process has not loaded the change; reloading Chrome still shows the error. Host denied TERM for the existing frontend process (PID 73975); no bypass attempted. User must stop/restart the frontend from its owning terminal, then proxy and browser lifecycle need retesting.
- PASS after config change: 18 frontend tests, TypeScript/production build, Prettier lint. T12 stays unchecked; no successful lifecycle, mobile, axe or visual acceptance is claimed for this Chrome run.

- Initial delivery: specification and UI concepts only; implementation has not begun.

## T00 — verified 2026-10-19
- Bootstrapped React 19/TypeScript/Vite and Java 21/Spring Boot 3.5.7. Public health and generated OpenAPI; private API denied by default.
- PASS: backend test + bootJar (3 integration tests); frontend typecheck/production build and Vitest (1 test). Local Java 21 installed under ignored .tools; host JDK remains unchanged.

## T01 — BLOCKED on PostgreSQL runtime
- Added PostgreSQL 16 Compose configuration, five Flyway migrations, owner/date indexes, constraints and Testcontainers migration/replay test. All five migrations applied successfully in H2 PostgreSQL compatibility mode through the bootstrap integration suite.
- BLOCKED: Docker CLI exists but daemon is unavailable; no PostgreSQL server installed. PostgreSQL Testcontainers test is explicitly skipped without Docker. T01 remains unchecked until actual PostgreSQL validation. Demo fixtures will be opt-in, never automatically loaded into customer accounts.
- Continuing independent tasks using isolated H2 tests; PostgreSQL integration remains a release gate.

## T02 — verified
- BCrypt cost 12, HttpOnly/SameSite strict session cookies, CSRF on writes/login, session rotation, generic bad-login messages and bounded per-IP authentication limits. Secure cookies default on; local opt-in disables them for HTTP development.
- PASS: AuthTest registration/session/logout and CSRF; BootstrapTest unauthenticated API denied; BillFlowTest cross-owner read/edit/pause/payment all return 404. No password hashes in profile responses.

## T03 — verified
- Owner-scoped bill CRUD, explicit pause semantics, server validation, ISO currency validation, decimal(19,4), optimistic versions, pagination and duplicate warnings. Editing invalidates unpaid projections; paid snapshots are preserved.
- PASS: BillFlowTest creates, validates, edits, detects stale versions, checks pagination, and preserves paid history on pause. Tests run on H2; PostgreSQL release gate remains blocked under T01.

## T04 — verified
- Original-anchor date engine supports all six recurrence types, explicit month-end policy, LocalDate business dates and HALF_EVEN posting at ISO currency minor units. Currency totals remain separate. Server projections include version/as-of/assumptions, with persisted snapshots.
- PASS: nine ScheduleTest fixtures/property checks (400 Gregorian years); BillFlowTest leap-day/idempotent payment/backdated replay/timezone/pause scenarios. 17 backend tests pass; one PostgreSQL test skipped because Docker is unavailable.
- Independent calendar/posting reconciliation recorded in docs/fixtures/golden-reference.md. No credit, mortgage, price forecast or amortization claims are made by this bills MVP.

## T05 — verified functionally; browser visual acceptance tracked in T12
- Implemented reference-style green dashboard card, seven/30-day unpaid server totals, due counters, actual overdue flags, occurrence payment actions, empty/loading/error/retry, assumptions and calm note. Responsive side rail/desktop columns and mobile bottom navigation.
- PASS: dashboard loading/empty/retry/multi-currency assumptions tests; real HTTP dashboard/payment lifecycle. No screenshot financial totals are hardcoded into accounts.

## T06 — verified functionally
- Bills/subscription filters, search/status, owner-scoped pagination, duplicate warnings, server-derived next unpaid date, detail facts and payment timeline. Pause preserves paid history and edit uses optimistic versions.
- PASS: component filtering/duplicates/error-state tests; BillFlowTest CRUD/ownership/history; real HTTP edit/conflict flow.

## T07 — verified functionally
- Month/list calendar, original-date badges, explicit textual overdue/paid states, month navigation, selected-day list, detail navigation and idempotent payment/undo.
- PASS: calendar mode/date-label/loading/error tests, backend leap-date/ownership/payment tests and real HTTP calendar paging.
- Product scope follows bills MVP, not the generic strategy/simulator words in the task title (see docs/adr/001-scope-and-data.md).

## T08 — verified functionally
- Separate bill/subscription editor states, RHF/Zod input validation, amount/currency/date/frequency/category/reminder/month-end fields, original-anchor replay, preserved paid timeline and conflict messages.
- PASS: editor client-boundary and backend validation/replay tests, server decimal string preservation through maximum precision. Reference comparison is still pending rendered browser access in T12.

## T09 — verified functionally
- Insights spending/trends/categories tabs, original-currency totals, scheduled commitment bar chart, category donut, exact tables, subscription and unpaid totals, visible assumptions. Trend charts explicitly describe template-derived commitments; historical-spending comparisons are withheld without complete evidence.
- PASS: no-invented-comparison and error/loading tests; API insights reconciles edited and paid values; frontend production build includes route-level lazy chunks. No loans/amortization are introduced into the bills MVP.

## T10 — verified
- CSV/JSON downloads with no-store headers, formula-injection escaping and quote handling. Password + DELETE reauthentication removes active records and invalidates the deleting session; other sessions are rejected on their next request. Retention limitations are visible.
- PASS: DataReminderTest export privacy, owner isolation, exact decimals, bad-password rejection, full delete and surviving-other-user checks; three CSV boundary assertions. Real HTTP lifecycle exports and deletes a synthetic account.

## T11 — verified
- Hourly projection/in-app reminder refresh using each owner's timezone; local-day offsets, preferences and unique occurrence/date delivery records. No external notification promises. Projection snapshots expire after 30 days.
- PASS: reminder offset/disabled/idempotent delivery integration test; payment/timezone preservation test. Added fixed-clock UTC-midnight/Toronto/Vancouver/Auckland DST boundary fixture.

## T12 — BLOCKED on approved browser runtime
- Added real-API Playwright desktop and 375px mobile full lifecycle, per-page axe WCAG checks, horizontal-overflow assertions and screenshot capture. Component tests cover all primary page load/error/retry states; PWA shell/offline fallback caches no financial API data.
- Actual real HTTP lifecycle PASSED without a browser: register → create → projection → duplicate pay → calendar → undo → edit/conflict → insights → reminder → export → account deletion.
- BLOCKED: both browser projects failed before page launch because macOS sandbox denied Chromium MachPortRendezvous bootstrap permission. Existing Chrome Computer Use access was also not approved. No bypass/override attempted. Screenshots/axe/tab order and exact visual matching are not verified. T12 remains unchecked.

## T13 — implemented support; BLOCKED release verification
- Added GitHub CI Java/Node/PostgreSQL/Testcontainers/E2E/axe/dependency scan workflow, non-root Dockerfiles, same-origin nginx/CSP, safe structured request IDs, generic error model, health/readiness endpoints, encrypted backup and guarded isolated restore scripts, release/rollback runbook.
- PASS: frontend full npm audit after upgrading Vitest to 5.0.5: zero vulnerabilities. Backup script tests (3) verify encryption pipeline invocation, restrictive output mode, production-restore rejection and plaintext cleanup using disposable stubs; shell syntax checks pass.
- Spring Boot upgraded to the available 3.5.16 maintenance release. Backend image/dependency scan, actual Docker build, PostgreSQL encrypted restore rehearsal, remote CI execution, monitoring and load acceptance remain unverified. T13 stays unchecked; scripts are not proof of an operational backup.

## T14 — BLOCKED; not deployed
- Prepared docs/RELEASE.md with staging/production gates, privacy/support/terms prerequisites, HTTPS/secrets/backup/rollback checks and explicit human production approval.
- BLOCKED: no staging account, hosting configuration, domain, credentials or deployment authorization supplied. No publishing, billing or external financial actions performed. No deployed URLs to report.

## Final local verification snapshot — 2026-10-19
- Spring Boot 3.5.16 / Java 21: test + bootJar PASS; 22 passed, 3 PostgreSQL tests skipped due to Docker. Includes local demo opt-in and fixed-clock DST tests.
- Frontend: 18 Vitest tests PASS; strict TypeScript/production build PASS; Prettier lint PASS; full npm audit reports zero vulnerabilities. Route chunks are below the default 500 kB warning threshold.
- Compose configuration and backup/dev shell syntax validated. Three backup/restore guard tests PASS. Actual database restore and container image scan remain blocked.
- Browser QA remains blocked before launch; no screenshots or axe pass is claimed.
- Latest packaged Spring Boot 3.5.16 application also passed the real HTTP lifecycle on isolated loopback port 8082, including nextDue skipping recorded paid instances. This verification instance uses an isolated in-memory database, not production storage.
- Development runtime note: rebuilding a jar while an earlier JVM uses it requires restarting that earlier service. The environment rejected signaling the earlier development JVM; no override was attempted. Stop previous development services before using scripts/dev.sh. No current preview or deployment URL is being represented as a verified release.

## Continued regression verification — 2026-10-19 22:31 America/Toronto
- PASS: forced backend `test bootJar --rerun-tasks`; 25 tests total, 22 passed, 3 PostgreSQL tests skipped, zero failures/errors.
- PASS: frontend 18 Vitest tests, TypeScript/production build and Prettier checks; backup/restore guard tests 3/3 and shell syntax checks.
- PASS: real HTTP session lifecycle (`npm run test:http`), including synthetic account creation, projections, payment/undo, edit/conflict, export and deletion. This targets the direct IPv4 API and does not verify the frontend proxy.
- Chrome extension connection is available. Opened the current 5173 page and confirmed visible “We couldn’t load this” / “The service could not complete this request.” HTTP proxy `/api/v1/auth/me` still returns 500. T12 remains BLOCKED on restarting the existing frontend from its owning terminal; previous host signal rejection was not bypassed. Mobile, axe and successful browser lifecycle remain unverified.
- T01 remains BLOCKED: Docker daemon unavailable; skipped PostgreSQL tests are not acceptance. T13 operational gates and T14 deployment remain blocked as previously documented. No task newly checked.

## T12 — independent proxy verification, 2026-10-19 22:36 America/Toronto
- Started a separate Vite process on loopback port 5185 using the current checked-in configuration. Port 5174 was occupied; no existing processes were stopped or signaled. The previous host rejection was respected.
- PASS: new frontend proxy `/api/v1/auth/me` returns expected JSON 401; direct API `/health` returns 200/UP. The old 5173 process still returns 500.
- PASS: `DUEWISE_TEST_API_URL=http://127.0.0.1:5185/api/v1 npm run test:http` (1/1), exercising the full synthetic-account HTTP lifecycle through Vite, including CSRF/session cookies and mutations. This establishes current proxy configuration correctness without claiming that the old preview was restarted.
- BLOCKED: Chrome opened 5185 but stayed on the loading skeleton; direct browser navigation to the same proxy API timed out in Page.navigate, followed by debugger detach on state observation. Shell/Playwright HTTP requests succeeded. No successful browser business flow, axe scan or responsive acceptance is claimed. Browser troubleshooting guidance was consulted; no alternative unauthorized browser mechanism used.
- T01 remains blocked: Docker daemon is unavailable. T12/T13/T14 remain unchecked.

## T12 — Chrome functional regression, 2026-10-20
- Read project contracts and progress. No service was listening on loopback ports 80, 5173 or 8080; started the documented `./scripts/dev.sh`. Current frontend is http://127.0.0.1:5173/ (not port 80), backend local profile is 8080. Kept development services running for review.
- PASS in actual Chrome: startup error retry after API readiness → welcome → synthetic account registration → empty dashboard → create monthly Synthetic Chrome QA bill (10.0050 CAD) → detail/timeline (10.00 CAD HALF_EVEN occurrence) → record payment (next due advances to November) → undo → October calendar → bill list → Insights reconciles 10.00 → edit to 12.34 → detail and dashboard reflect updated input.
- PASS: mobile viewport override requested 375×812; rendered dashboard screenshot inspected, mobile navigation and calendar month/list switch work. Calendar and Insights DOM client/scroll widths both 360 (no horizontal overflow; scrollbar reduces client width). Restored default desktop viewport and inspected final dashboard screenshot. Exact reference-image matching and all-page responsive acceptance are not claimed.
- PASS: sign-out invalidates session (welcome confirmed after reload), re-login succeeds with synthetic account. JSON export button shows “Your export is ready”; browser download-event wait timed out, so downloaded-file contents are not verified in Chrome. Account retained with synthetic data only for review; no customer account deleted.
- T12 remains unchecked pending axe, keyboard/screen-reader checks, browser export artifact confirmation and remaining acceptance coverage. Previous startup/proxy and Chrome connection blockers are resolved for this run; T01 PostgreSQL and T13/T14 operational/deployment gates remain outstanding.
- PASS: complete automated real HTTP lifecycle through the current 5173 proxy (`DUEWISE_TEST_API_URL=http://127.0.0.1:5173/api/v1 npm run test:http`), 1/1 passed, including disposable synthetic account export/deletion.

## T01 — PostgreSQL runtime verified, 2026-10-20
- User started Docker Desktop; `docker info` confirms engine 28.4.0 is available.
- PASS: Java 21 `test bootJar --rerun-tasks`: 25 tests, zero failures/errors, zero skips. The three previously skipped tests now execute against actual Testcontainers PostgreSQL 16.11-alpine.
- PostgresMigrationTest applies all five Flyway migrations, validates them, and confirms replay performs zero new migrations. PostgresApplicationTest passes both inherited CRUD/date/ownership/payment flows on actual PostgreSQL. Demo opt-in remains covered by DemoTest; synthetic inputs are explicitly labelled and production demo route remains absent.
- PASS: Compose config validation using a disposable synthetic password supplied only to `config --quiet`; no existing credentials read or persistent Compose database created. T01 is now checked based on verified migration/application tests and existing implementation. This does not claim production database acceptance or a PostgreSQL backup restore rehearsal.

## T13 — Docker image build attempt, 2026-10-20; BLOCKED by host permissions
- Attempted frontend/backend Dockerfile builds with local-only QA tags. Both fail before building because Docker buildx cannot write `/Users/lili/.docker/buildx/activity/.tmp-desktop-linux...` (operation not permitted). No host permission override or alternate configuration used to bypass the rejection.
- Image builds/scans and operational restore remain unverified. T12/T13/T14 stay unchecked.

## T12/T13 — acceptance work in progress, 2026-10-20
- Added a Linux Playwright runner (`scripts/qa-browser.sh`) using the official version-matched image and a separate PostgreSQL 16.11 database/API (loopback 55435/18982). This is isolated synthetic QA, not staging or production. Current proxy target can be supplied through DUEWISE_API_PROXY_TARGET for the runner.
- Axe exposed actual low-contrast sidebar/tab text; darkened those colors. Fixed outdated mobile-heading, raw four-decimal amount and timezone-combobox test selectors. Desktop/mobile page screenshots and axe checks reached settings successfully.
- Full browser deletion flow exposed stale authenticated UI after the server invalidated the session. Replaced QueryClient.clear on logout/deletion with cancellation, removal of private queries, and updating the still-observed me query. Added a sign-out-without-reload regression; frontend unit tests now 19/19 pass. Browser deletion regression remains under final verification.
- Extended browser checks: downloaded JSON contents, keyboard skip link, reduced motion, offline indicator, 768px tablet primary-page checks, and a production service-worker offline/cache-privacy test. Final production browser suite still pending; do not treat intermediate screenshots as a complete T12 pass.
- PASS: real age-encrypted PostgreSQL backup/restore using API-created synthetic CAD 10.0050 source, CAD 10.00 occurrence, recorded payment and reminders. All 8 tables match by count and deterministic full-row digest; measured restore 1 second, plaintext temporary file removed. Evidence docs/qa/restore-rehearsal.txt; scripts test_restore_runtime.py and rehearse_restore.sh. Disposable key remains inside the isolated QA container only; no user credentials accessed.
- Fixed request logging filter ordering so unauthorized responses also carry matching UUID request IDs. PASS: 25 backend tests, zero skipped, including PostgreSQL and the request-ID regression. Live liveness/readiness/unauthorized correlation passed (docs/qa/observability.json).
- Packaged-archive Trivy scan found vulnerabilities that a filesystem-only lockfile scan missed. Patched Jackson BOM 2.21.7, Tomcat 10.1.61 and PostgreSQL JDBC 42.7.12; tests pass. Final raw scan now contains only two Spring MVC findings. Official prerequisites and enterprise-only 6.2 fix availability documented in docs/qa/SECURITY-REVIEW.md. No ignore rules or severity suppression added; strict scan gate remains failing.
- Initial four-way concurrent API p95 failed while multiple builds/scans were competing for resources; retained docs/qa/runtime-performance-initial.json. A controlled final run is pending; no performance pass claimed yet.
- T13 remains BLOCKED on host buildx write denial, unresolved raw Spring findings and actual remote CI/monitoring operation. Cleanup of an agent-created stopped browser container was also rejected by automatic approval review (approval required; approval policy Never); no alternate deletion mechanism used. This does not prevent running separate new QA containers.

## T12 — verified, 2026-10-20 01:30 America/Toronto
- PASS: clean Linux production TypeScript/Vite build with explicit Node types; frontend unit suite 19/19 and Prettier lint. The clean runner exposed missing Node type declarations hidden by the host incremental environment; declared @types/node 22 and the node compiler type.
- PASS: production desktop/mobile Playwright suite 6/6, zero failures/skips/flaky cases (docs/qa/e2e-core-results.json). Covers registration, empty state, create/edit, payment/undo, calendar, filters, Insights/trends/categories, reminders, actual exported JSON content, timezone setting and account deletion returning to welcome without reload.
- PASS: axe WCAG 2/2.1 A/AA checks and horizontal-overflow assertions across 10 desktop states, 10 mobile states, and five tablet primary pages. Requested dimensions: desktop 1440×1000, mobile 375×812 and tablet 768×1024. Keyboard skip-link/visible focus, reduced-motion and online/offline indication asserted. Screen-reader names/roles examined through axe and the previous Chrome AX-tree run; no VoiceOver/NVDA speech certification is claimed.
- Inspected primary-page desktop/mobile screenshots against the concept and inspected tablet calendar/editor. Existing truthful scope differences remain intentional (no social providers/banking, no fabricated financial comparisons). Full-page screenshots can show fixed bottom navigation at the capture scroll position; it is not a second in-flow navigation bar.
- Visual review caught an offline stylesheet cache miss despite a functional offline test. Service worker now serves cached offline.css and uses cache version v2. Added explicit background/button-style assertions. PASS: targeted production offline suite 2/2, zero failures/skips (docs/qa/e2e-results.json); styled final mobile/desktop offline PNGs inspected. No financial API/export responses cached.
- T12 is now checked after verification. This is QA acceptance, not public deployment or an independent WCAG certification.

## T13 — substantial local verification; still BLOCKED, 2026-10-20
- PASS: patched backend 25/25 tests, no skips; packaged jar built. Jackson/Tomcat/PostgreSQL driver findings cleared; final unfiltered Trivy 0.76.0 archive report retains CVE-2026-47884 and CVE-2026-47890 in spring-webmvc 6.2.19. No suppression/ignore added. Official applicability and 6.2 enterprise-only fix documented in SECURITY-REVIEW.md; strict security gate not passed.
- PASS: 20 synthetic monthly bills, concurrency 4, 100 measured API requests (25/endpoint), one documented warm-up/endpoint: p95 dashboard 177.20ms, bills 104.48ms, calendar 160.55ms, insights 174.31ms, all <400ms. docs/qa/runtime-performance.json. Initial contention failure retained separately. Local measurement does not establish a staging/production SLO.
- PASS: real encrypted PostgreSQL golden-data restore (8 table digests/counts match, 1-second restore); backup guard tests 3/3. Liveness/readiness and unauthorized request-ID correlation verified; evidence JSON retained.
- Fixed nginx add_header inheritance so per-location caching directives do not remove CSP/nosniff/frame/referrer headers. Actual stock nginx 1.28 container with mounted release config/static build passes nginx -t and HTTP checks on HTML, JS, service worker and 502 upstream-error responses. Evidence nginx-headers.json. This is configuration validation, not a built/scanned release image.
- Extended CI to run production browser/offline tests, API performance, encrypted restore rehearsal, packaged-Java scan, image builds and image scans. CI YAML parses; actual hosted execution remains unavailable in this workspace and is not claimed.
- BLOCKED: fresh attempts at BOTH release-image builds still fail before build: Docker cannot write /Users/lili/.docker/buildx/activity/.tmp-desktop-linux... (operation not permitted). No host permission/security override attempted. Image scans cannot pass without those images; remote monitoring/alerts and hosted CI still need an operator environment. T13 remains unchecked.
- Isolated QA API and running QA PostgreSQL/nginx containers stopped after verification. Stopped test containers were retained when automatic approval review rejected removal (approval required, policy Never); no alternate deletion attempted. Development preview restored: frontend 5173 returns 200, proxy auth/me expected 401, API 8080 health UP. This is local development only.

## T13/T14 — hardening and deployment handoff, 2026-10-20
- T13: backup.sh now uses a unique restrictive temporary file, removes it on failure and publishes the completed encrypted archive by rename. Same-second backups preserve both archives. Added dump failure, encryption failure, collision and failed-restore plaintext-cleanup regressions.
- PASS: backup/restore guard tests 7/7 and shell syntax checks. Disposable stubs verify failure behavior; this is not a new real encrypted PostgreSQL restore rehearsal.
- CI attempts frontend/backend image builds independently after other failures, scans each successfully built image and available packaged jar, and retains JSON vulnerability reports as artifacts. Strict high/critical rejection remains enabled. PASS: YAML parsing and manual condition/output review; hosted execution unverified.
- PASS: forced Java 21 backend test rerun 25/25, zero skips/failures/errors. bootJar check passed (up-to-date). Frontend tests 19/19, Prettier lint and TypeScript/Vite production build pass.
- BLOCKED T13: no new host permission for the previously denied buildx path; no bypass/repeat of the rejected operation. Two existing unfiltered Spring MVC findings remain. Current official Boot 3.5 documentation still identifies 3.5.16/Framework 6.2.19; Spring Enterprise documents 6.2.20 fixes. No paid access or major-version migration attempted. Hosted CI, release-image scans and remote monitoring remain unverified.
- BLOCKED T14: no approved staging provider/project, hostname, deployment credentials/configuration or publishing authorization. Added operator inputs and concrete staging acceptance evidence to docs/RELEASE.md and requested a staging target. No deployment performed; no deployed URLs. T13/T14 remain unchecked.

## T13/T14 — operational probe implementation, 2026-10-20
- Added read-only infra/scripts/check_runtime.py: validates liveness and database readiness UP, anonymous bills access 401, and matching UUID header/body request IDs. Rejects redirects, credentials/query/path in origins, malformed data and connection failures. Sanitized JSON reports only named check outcomes; nonzero exit supports operator alert scheduling.
- PASS: 9 probe regressions (healthy, database down, correlation mismatch, public private-route, network outage, invalid origin, HTTPError handling, redirect rejection, malformed JSON/UUID). Existing backup tests 7/7 pass. CI YAML parses; added both probe tests and actual PostgreSQL-backed probe invocation to hosted workflow. Hosted execution remains unverified.
- PASS actual HTTP: started independent API on loopback 18983 with temporary in-memory H2 override; all three checks pass. Gracefully stopped only this test process, then verified all checks fail and exit code 1. Evidence docs/qa/runtime-probe-local.json. This does not repeat PostgreSQL acceptance or establish deployed monitoring. Existing development data untouched.
- Updated release runbook with private-origin probe usage, suggested one-minute schedule/three-failure alert policy, and staging alert/recovery delivery verification. No alerts sent or external scheduler configured.
- BLOCKED T13: existing strict Spring security findings, release-image build permission, hosted CI and actual monitoring/alert delivery still unresolved. No denied operation retried or security suppression added.
- BLOCKED T14: no staging provider/project/domain/credentials supplied. No staging or production deployment performed; both tasks remain unchecked.

## T13/T14 — prevent skipped PostgreSQL release acceptance, 2026-10-20
- Found a release-gate gap: Testcontainers deliberately skips PostgreSQL tests without Docker, while Gradle can still exit successfully. Added infra/scripts/check_test_reports.py to require executed PostgresApplicationTest and PostgresMigrationTest suites and reject any skipped/failed/error tests, missing/empty/duplicate/malformed reports, or mismatched testcase/summary counts.
- CI now runs cleanTest before tests, executes report-gate/monitoring regression tests, fails on unacceptable backend reports, and archives the JSON gate result. README and release checklist include the same fresh-run procedure. Report inspection alone cannot prove freshness outside this clean-run procedure.
- PASS: 8 release-gate tests plus 9 monitoring tests (17 total); backup guards 7/7; workflow YAML parses. Actual Java 21 cleanTest test bootJar passes: 25 tests, zero skips/failures/errors, including both PostgreSQL suites. New gate accepts these fresh reports; docs/qa/backend-test-gate-local.json. No application/frontend code changed, so prior frontend/browser evidence is retained rather than rerun.
- BLOCKED T13: existing unfiltered Spring MVC findings, host permission for image builds, actual hosted CI and deployed alert delivery remain unresolved. No security gate relaxed and no previously denied build retried.
- BLOCKED T14: staging provider/project, region, hostname, deployment credentials/configuration and publishing authorization still absent. No staging/production deployment. T13/T14 remain unchecked; remaining release gates require operator/environment input, not additional local test claims.

## T13 — user-approved Boot 4 security migration verified, 2026-10-20
- User explicitly approved Boot 4.0.8 migration to resolve the strict security findings; no paid vendor access or deployment included. Updated README, engineering requirement and ADR accordingly. Local pre-migration backend source snapshot retained in .local/boot35-pre-migration.zip for rollback review; no secrets or customer database copied.
- Migrated to Framework 7.0.9, application Jackson 3, Flyway starter, Boot 4 web/security test starters, Testcontainers 2 artifacts/imports and springdoc 3.0.3. BigDecimal remains an explicit JSON string. The five Flyway SQL migrations and domain/date engine are unchanged.
- Initial Boot 4 default-BOM scan still failed with 8 high/critical Tomcat/Jackson findings; retained backend-security-boot4-initial.json. Patched within the new platform families to Tomcat 11.0.27 and Jackson 3 BOM 3.1.8; kept patched Jackson 2 BOM 2.21.7 for transitive consumers. JDBC now follows Boot BOM 42.7.13.
- PASS: final Trivy 0.76.0 rootfs archive scan, HIGH/CRITICAL, exit-code=1 gate exits 0, zero findings and no suppressions. Reports backend-security-boot4.json and backend-security-boot4-summary.json include archive/report SHA-256 and scanner database timestamp. Final archive hash still matches the scanned artifact. This resolves the two former Spring MVC findings; it does not establish final image security.
- PASS: final Java 21 cleanTest test bootJar: 25/25 tests, zero skips/failures/errors, including real PostgreSQL migration/replay and ownership/date/payment tests. Report gate passes. Frontend 19/19 tests, Prettier and TypeScript/Vite build pass. Linux clean npm ci audit reports zero vulnerabilities.
- PASS: production desktop/mobile browser suite 6/6, zero skips/failures/flaky, including real HTTP lifecycle, axe, tablet checks, export/deletion, keyboard/reduced motion and styled offline/cache privacy. docs/qa/boot4-e2e-results.json. Earlier T12 screenshots were regenerated by the existing suite; no frontend UI code changed.
- PASS: isolated PostgreSQL 16.11 API liveness/readiness/401 request-ID probe; docs/qa/boot4-runtime-probe.json. Actual age-encrypted restore reconciles all 8 table counts/full-row digests, measured 0 whole seconds (subsecond resolution, not zero-cost recovery), plaintext cleanup verified; boot4-restore-rehearsal.txt. Synthetic golden input 10.0050 CAD -> occurrence 10.00 CAD, one recorded payment.
- PASS: controlled 20-bill, concurrency-4, 100-request API sample: p95 dashboard 31.56ms, bills 15.12ms, calendar 29.82ms, insights 31.00ms, each <400ms. boot4-runtime-performance.json. Local measurements do not establish staging SLOs or a comparative speedup.
- Restore rehearsal now supports explicit local QA API/container selectors, allowing a new isolated database without touching previous fixtures. Added guards against remote/credentialed URLs and non-QA container names. PASS: 20 gate/monitoring/restore-target regressions and 7 backup guard tests; CI YAML parses.
- Remaining BLOCKED T13: final release-image builds/scans still require host permission for the previously denied /Users/lili/.docker/buildx/activity path. Current tools disallow elevation, so no system approval prompt can be issued; no bypass/retry of the rejected build. Hosted CI and deployed alert delivery require the actual repository/operator environment.
- BLOCKED T14: requested repository URL and staging provider/project/hostname are still pending. No external publishing, billing or secret access performed. T13/T14 remain unchecked despite the now-passing packaged security gate.

- QA cleanup: gracefully stopped this run's API and duewise-boot4-postgres container. Stopped synthetic QA/scan containers retained; no prior denied deletion retried.

## GitHub push requested — BLOCKED by Git metadata write policy, 2026-10-20
- User explicitly authorized pushing this project to https://github.com/felix007-li/due-wise.git. Read-only git ls-remote --symref succeeds with no advertised refs; remote appears empty at this check.
- Local directory is not yet a Git repository. Standard git init -b main was denied: project .git: Operation not permitted. Current tool policy prohibits privilege escalation, so no approval dialog can be issued. Requested host write permission for this project's Git metadata; no alternate GIT_DIR, temporary-repository workaround or other bypass attempted.
- Prepared source review: 177 candidate files (~7.5 MB) at review time, zero targeted private-key/GitHub-token/AWS-key/live-Stripe pattern findings, no files >=50 MiB. docs/qa/push-review.json states the limited review scope; it is not a full secret-scanner certification or a staged manifest.
- Expanded .gitignore for macOS metadata, local env variants, private-key/container credential extensions and database dumps; retains .env.example. Corrected ARCHITECTURE.md's platform version to the authorized Boot 4.0.8 migration. Local env/database/cache/build/QA temporary outputs are excluded from publication.
- PASS: 20 gate/monitoring/restore-target regressions; current backend report gate accepts 25 tests with zero skips/failures/errors. Previous Boot 4 frontend/browser/archive-security evidence remains valid; no application code changed in this push-preparation turn.
- No commit or push performed. GitHub hosted CI remains unverified; T13/T14 still unchecked. Recheck remote refs before eventual first commit/push to avoid overwriting intervening remote changes.

## Git permission recheck after user confirmation — still BLOCKED, 2026-10-20
- User reported Git write access opened. Retried only standard git init -b main against the project directory; host still returns .git: Operation not permitted. No Git repository, commit or push created.
- Rechecked the authorized remote read-only; no refs advertised. No force push or alternate Git metadata location used. The reported permission change has not taken effect for this active tool session; an environment change or operator terminal is required.
