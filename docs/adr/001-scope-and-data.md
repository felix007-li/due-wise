# Bill tracking boundaries

- The implementation is the five-page bills/subscriptions MVP in PRODUCT.md. Generic task words (strategy, simulator, amortization) do not expand the domain into lending. No bank, exchange-rate, mortgage or credit APIs are used.
- Screenshot totals are design references only. No sample financial facts are loaded automatically. The local-profile-only demo endpoint is explicit, empty-account-only, and prefixes all names with Demo.
- The HTTP layer delegates to bill, projection and reminder application services; the independent recurrence engine is in domain/Schedule.java. JPA repositories scope owned reads by user ID. PostgreSQL migrations are the sole production schema source.
- DELETE bill means pause future unpaid occurrences. Paid facts remain. Account deletion is the explicit hard deletion path, reauthenticated with the password. Other sessions are rejected on the next request.
- Unpaid occurrences are disposable projections. Edits replay them from the original anchor; paid snapshots retain original name, category, currency, amount and due date. The scheduler serializes per-user materialization to prevent duplicate dates/deliveries.
- Posting boundary is per occurrence, HALF_EVEN at ISO currency minor units. Backend decimals serialize as JSON strings. Chart coordinates may use approximate JavaScript numeric values for drawing only; exact server totals are always visible separately. No currency conversion or mixed-currency grand totals.
- Comparisons to past spending are withheld because template-derived projections cannot establish complete historical spending coverage. Trend charts are labelled scheduled commitments. Paused templates retain paid history but are excluded from future unpaid projections.
- The dashboard displays 30 days including today, 7 days including today, and a documented 336-day overdue lookback. Older records remain accessible through paginated calendar and export.
- Local H2 is an explicitly selected persistent development profile, not a substitute for PostgreSQL acceptance. Production requires DB_URL/DB_USER/DB_PASSWORD and secure cookies.
- Reminders are in-app records only. No nonfunctional social sign-in, bank account linking, or push/email toggle is presented.

- On 2026-10-20 the user explicitly approved replacing the original Spring Boot 3.5 requirement with Boot 4.0.8 for security remediation. Framework 7.0.9 provides the public fixes; the 6.2 repair requires commercial support. Application JSON migrates to Jackson 3 with explicit decimal-string serialization. Java remains 21; domain rules, REST contracts and all five Flyway migrations remain unchanged. No commercial purchase or deployment is included in this approval.
