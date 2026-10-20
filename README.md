# DueWise

Bills and subscriptions that never surprise you. Java 21 / Spring Boot 4.0.8, React 19 / TypeScript responsive PWA. Five core pages follow ui_frames.png with welcome/sign-in, detail, reminder and settings states.

Financial projections come from the tested server engine. No bank connections, payment processing, exchange-rate conversion or verified market-price dataset. Screenshot figures are illustrative and are not loaded into accounts.

## Run locally

In this prepared workspace, `./scripts/dev.sh` starts both services with the project-local Java 21 toolchain. Stop existing development services before running it.

Requirements: Node 22.12+ and Java 21. The ignored .tools directory in this workspace contains a downloaded Java 21 toolchain and Gradle distribution; they are not required on other machines with Java 21 installed.

```sh
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

The `local` profile explicitly uses a persistent H2 database in backend/.local for development. Create a new account in the welcome screen. Local HTTP cookies are allowed only in this profile. This is not production configuration or PostgreSQL acceptance.

For PostgreSQL 16, create your own `.env` from `.env.example`, set a password, start Docker, then run `docker compose up -d db`. Export DB_URL, DB_USER and DB_PASSWORD into the backend process and omit the local profile. For HTTP development only, set SESSION_SECURE=false. Production requires HTTPS and SESSION_SECURE=true.

- Frontend: http://127.0.0.1:5173 when `npm run dev` is running.
- API: http://localhost:8080; `/health` is liveness, `/actuator/health` includes database readiness.
- OpenAPI: http://localhost:8080/swagger-ui/index.html and `/v3/api-docs`.

These are local addresses, not deployed environments. The Vite server proxies same-origin API requests. The local-only POST `/api/v1/account/demo` can explicitly add labelled synthetic demo inputs to an empty authenticated account; it is absent from production.

## Verification

```sh
cd backend
./gradlew cleanTest test bootJar
cd ..
python3 infra/scripts/check_test_reports.py
cd frontend
npm test
npm run build
npm audit --audit-level=high
npx playwright install chromium
npx playwright test
cd ..
python3 infra/scripts/test_backup.py
```

Browser tests require the API to be running. CI starts it against PostgreSQL. `npx playwright test api-flow --project=desktop` runs the real HTTP lifecycle without launching a browser. PostgreSQL Testcontainers tests explicitly skip when Docker is absent; a skipped test is not acceptance. The release report gate requires both PostgreSQL suites, verifies per-test results against report counts, and rejects any skips, failures, missing or malformed reports. Run it only after a fresh test run; it does not establish the freshness of reports from earlier runs.

The CI workflow builds both stacks, runs PostgreSQL/ownership/date and browser tests, scans dependencies and uploads QA evidence. Non-root Dockerfiles and same-origin nginx configuration are provided, but have not been deployed.

Current evidence and blockers: PROGRESS.md. Sequential checklist: TASKS.md. UI mapping and visual QA limitations: docs/qa/UI-CONFORMANCE.md. Launch gates and rollback/backup procedure: docs/RELEASE.md. Domain decisions: docs/adr/001-scope-and-data.md.

## Isolated QA evidence

T12 production browser verification and screenshots are recorded in docs/qa. `scripts/qa-browser.sh` uses the official Linux Playwright image and expects an isolated PostgreSQL-backed API on port 18982; set DUEWISE_QA_API_PORT to change it. It performs a clean build and runs the production preview; DUEWISE_QA_TEST_FILE can select a test file. It is separate from the persistent local development account database.

`infra/scripts/test_runtime.py` measures a disposable 20-bill account on that local API. `infra/scripts/test_restore_runtime.py` rehearses encrypted restoration with the dedicated duewise-qa-postgres container and copied backup/restore/rehearse_restore scripts; never point it at a customer database. All inputs are synthetic. T13 is not complete: release image builds/scans, hosted CI and deployed monitoring remain unverified. The user-approved Boot 4 migration clears high/critical findings in the packaged Java archive; see docs/qa/backend-security-boot4-summary.json. This does not establish release-image security. See PROGRESS.md and docs/qa/SECURITY-REVIEW.md.
