# API and database contract

## Domain tables (initial logical model)
User, Bill, Occurrence, Payment, ReminderPreference, NotificationDelivery

All user-owned tables: UUID PK, user_id foreign key, created_at UTC, updated_at UTC, row_version for optimistic concurrency; indexes on user_id + date. Money decimal(19,4) and a currency column; dates DATE, timestamps TIMESTAMPTZ. Persist projections separate from source facts.

## REST contract
GET /api/v1/dashboard
- GET/POST /api/v1/bills
- GET/PATCH/DELETE /api/v1/bills/{id}
- GET /api/v1/calendar?from=&to=
- POST /api/v1/occurrences/{id}/pay
- POST /api/v1/occurrences/{id}/undo
- GET /api/v1/insights
- GET/PUT /api/v1/settings

## Standard response semantics
- `200` successful GET/patch; `201` created; `204` deletion; `400` malformed; `401` unauthorized; `403` forbidden; `404` not found or other-user-owned; `409` optimistic conflict; `422` invalid financial assumptions.
- Error model `{code,message,fieldErrors,requestId}`. All list endpoints paginated and filtered by owner.
- Domain projections include `asOfDate`, `calculationVersion`, `assumptions`, `warnings`, `roundedCurrencyAmounts`.

## Migration sequence
V001 users/auth → V002 domain root tables → V003 records/events → V004 scenarios and snapshots → V005 indexes and constraints. Use migrations, never runtime DDL.

## Implemented details

- Session authentication: GET `/api/v1/auth/csrf`, POST `/auth/register`, POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`. Passwords: 12–72 characters and at most 72 UTF-8 bytes. Get CSRF token before all mutations, including authentication. All endpoints here are under `/api/v1`.
- GET `/reminders` refreshes in-app reminders in the owner's timezone; PUT `/reminders/preference` sets `{enabled}`. No email, push vendor, banking or payment API is connected.
- GET `/account/export?format=json|csv`; DELETE `/account` requires `{password,confirmation:"DELETE"}`. JSON includes source records, generated occurrences and payment marks; CSV contains bill templates. Exports are no-store.
- PATCH bill accepts a complete editable representation plus `rowVersion` (not JSON Patch). DELETE pauses the template and clears unpaid projections while preserving recorded paid history.
- Decimal amounts serialize as JSON strings to preserve precision in JavaScript clients. `nextDue` is a derived next unpaid scheduled date within the next annual schedule window; `firstDue` remains the original anchor.
- Bill pagination defaults to 50, max 100; calendar uses stable due-date/UUID ordering, max 100 per page, with ranges <=367 dates. No currency conversion. Financial projections use the authenticated owner's local day.
- Local development only: explicit POST `/account/demo` seeds labelled synthetic facts into an empty account; absent unless the `local` Spring profile is selected.
