# Sequential implementation checklist

- [x] T00 — Bootstrap frontend and backend with /health and OpenAPI. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T01 — Set up PostgreSQL, migrations, Docker Compose and seed demo fixtures. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T02 — Add sign-in and strict per-user data authorization. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T03 — Implement domain records CRUD and validations. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T04 — Implement deterministic financial/date engine and golden tests. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T05 — Build page 01 dashboard incl empty and error states. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T06 — Build page 02 list/form/details. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T07 — Build page 03 calendar/strategy/simulator. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T08 — Build page 04 editor/timeline/comparison. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T09 — Build page 05 insights/payment/amortization. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T10 — Add CSV/JSON export and account deletion. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T11 — Add notifications or projection refresh and time-zone correctness. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [x] T12 — E2E tests + accessibility + mobile and desktop QA. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [ ] T13 — CI security checks, observability and backup/restore. **Done when:** implementation, tests, and PROGRESS evidence exist.
- [ ] T14 — Deploy staging, verify release checklist, human approval before production. **Done when:** implementation, tests, and PROGRESS evidence exist.

Never check a task without actual tests. When external credentials block a task, mark BLOCKED in PROGRESS and continue independent tasks.

Status: T00–T12 verified. User-approved Boot 4.0.8 migration clears the packaged Java high/critical scan gate. T13 remains blocked on release-image builds/scans (host buildx write denial) and hosted CI/deployed monitoring verification. T14 remains not deployed; staging target and credentials/configuration are absent. See PROGRESS.md and docs/qa/SECURITY-REVIEW.md.

Latest T13/T14 pass: backup failure/collision hardening verified (7 tests), CI scan evidence handling updated, staging operator handoff documented. Release gates remain blocked; see PROGRESS.md entry dated 2026-10-20.

T13 monitoring probe added and verified against healthy/stopped isolated API (9 regression tests); CI/runbook updated. Deployment and external operational blockers remain.

T13 release report gate now enforces actual PostgreSQL execution and zero skips; fresh 25-test backend run and 17 gate/monitoring regressions pass. Remaining T13/T14 operator blockers unchanged.

2026-10-20: explicitly authorized Boot 4.0.8 migration verified: packaged high/critical security findings 0; backend 25/25, frontend 19/19, production browser 6/6, real encrypted PostgreSQL restore and local p95 gates pass. Final image builds/scans, hosted CI, deployed monitoring and staging target remain blocked. See latest PROGRESS.md and docs/qa/SECURITY-REVIEW.md.
