# Launch gates — not deployed

No staging or production environment has been created. Local development is not deployment.

T14 operator handoff: provide the approved hosting provider/project, region, staging hostname, repository/CI host, secret-injection mechanism and deployment authorization. Supply credentials through that provider's secret manager, never this document. Resolve T13's strict security and release-image gates before publishing. No production deployment is authorized by the T14 task alone; record human approval against the tested staging release and immutable image digests.

Staging acceptance evidence must include the actual HTTPS URL and certificate check, deployed frontend/backend image digests, migration results on PostgreSQL 16, secure session-cookie verification, same-origin CSRF/authentication lifecycle, owner-isolation checks, synthetic-account export/deletion, readiness/alert delivery, performance measurements and an encrypted restore rehearsal. Record timestamp and release identifier for each check. Retain the previous compatible image digests for rollback.

Before staging:
- Start an approved Docker/PostgreSQL environment. Run `cd backend && ./gradlew cleanTest test bootJar`, then from the app root run `python3 infra/scripts/check_test_reports.py`. Both PostgreSQL suites must execute; zero skips are required. CI clears previous test results before execution and archives the gate summary as ci-backend-test-gate.json.
- Run frontend tests/build/audit and both desktop/mobile Playwright suites with axe. Inspect all screenshots in docs/qa against ui_frames.png and correct deviations. Check keyboard-only flow, screen reader, offline fallback and reduced motion.
- Run CI Trivy scan against the final lockfile and packaged backend. No high/critical findings may remain. The Boot 4.0.8 migration passes the local packaged-archive high/critical gate; see docs/qa/SECURITY-REVIEW.md and backend-security-boot4-summary.json. Final image scans are still required. CI must succeed on the actual repository host; the workflow has not run remotely here.
- Local PostgreSQL check passed at 20 bills, 4-way concurrency and 100 samples (p95 104–177ms). Re-run on the selected staging infrastructure; local results do not establish its SLO.
- Build and scan the non-root Docker images. Pin approved image digests for release.

Before public production (human approval required):
- Select hosting/region, credentials, domain, HTTPS termination, encryption at rest, and secret injection. Keep backend/PostgreSQL private; route browser API traffic through the same origin. Set SESSION_SECURE=true. Do not enable the local profile.
- Single API instance for the current in-memory session and rate limiter design. For multiple replicas, introduce shared session storage and distributed authentication limits before scaling.
- Configure health/readiness monitoring and alerts without exposing actuator diagnostics or customer data. Request logs contain request IDs, method, status and duration, never request bodies, email, tokens, credentials or financial contents.
- Provide operator identity, verified support/privacy contact, finalized terms, retention policy and Canadian release review. No credit/mortgage advice is implemented. English UI is complete; other locale preferences are preparatory hooks, not translated UI claims.
- Configure daily encrypted backups with operator-managed age recipient, external private storage and expiry of at most 30 days. Do not store decryption identities in the repository.
- Rehearse restore to a dedicated duewise_restore_* database. Compare migrations, owner counts, records and golden fixtures; document RPO <=24h and measured RTO. Restore scripts are not proof of a successful restore.
- Schedule deletion propagation through backup expiry. Avoid promoting deleted-user records from old backups without applying deletion records.
- Recheck authoritative Canadian references in DOMAIN-RULES.md if expanding beyond bill planning. User contracts override generic assumptions.

Rollback:
1. Stop writes and identify the failed release; retain request IDs and sanitized operational logs.
2. Roll back to the previously tested image if its schema is compatible. Flyway migrations are forward-only; do not erase migration history or issue runtime DDL.
3. If data recovery is required, obtain operator authorization, restore an encrypted backup into an isolated database, validate and replay post-backup source changes using a reviewed recovery procedure.
4. Promote only after privacy/deletion reconciliation and smoke checks. Restarting this single-instance app invalidates sessions; users sign in again.

Backup scripts require pg_dump/pg_restore 16 and age. They intentionally do not read repository secrets. The included Python tests use disposable command stubs to verify piping, file permissions, restore guard and plaintext cleanup; actual encryption/database restore must be rehearsed separately.

Backup publication is atomic: failed dump/encryption pipelines remove their temporary output; only a successful nonempty encrypted stream is renamed to a unique `.dump.age` archive. Same-second runs preserve separate archives. This local filesystem guarantee does not establish remote storage durability or a scheduled daily backup.

Operational probe: run `DUEWISE_MONITOR_API_URL=https://private-api-origin python3 infra/scripts/check_runtime.py` from an approved operator network. Use the API origin, since nginx serves the frontend at `/health`. The probe makes read-only requests to `/health`, `/actuator/health` and anonymous `/api/v1/bills`; it requires UP/UP/401 and matching valid UUID request IDs. It rejects redirects and URL credentials, and outputs only check results. Exit 1 means the scheduler should trigger the operator's configured alert. Configure a one-minute schedule, alert after three consecutive failures, and verify an actual alert/recovery on staging. This script does not provision a scheduler or send alerts; delivery remains a launch gate. Supply TLS trust through the operator environment; do not disable certificate verification.
