# Product requirements: DueWise

## Outcome
Bills and subscriptions that never surprise you. Solve one decision/problem reliably, not a full bank.

## Personas
Canadian individual or household who wants private, actionable calculations without linking financial institutions. Beginner-friendly defaults plus advanced settings.

## MVP scope
1. **Dashboard** — summary of bills due in 7 and 30 days; upcoming list, overdue flags, add quick action; no false Paid status.
2. **Bills & subscriptions** — filters by recurring type, active/paused, search, next due, edit/disable; duplicates are flagged.
3. **Calendar** — month and list views, date badges, paid/unpaid per occurrence, navigate to detail.
4. **Add/Edit Bill** — amount, currency, first due, recurrence, category, reminder offsets, month-end handling and save validation.
5. **Insights** — monthly commitments by category, subscription totals, upcoming cash needs, comparisons for complete historical periods.

## Non-goals
Bank synchronization, open banking, payments, trades, loan origination, underwriting, paid financial advice, machine-learning price forecasts.

## Lifecycle
Onboarding (demo or local example) → enter financial facts → get grounded insight → save/revisit → export/delete.

## Monetization experiment
Launch free functional core. Do not introduce paywall until retention and trust metrics justify it; later consider scenario exports and multi-profile plans.

## Risks
Wrong numbers, hidden assumptions, misleading advice, privacy breaches, irregular dates, stale contractual terms. Mitigate with scenarios, input validation, auditable formulas, and QA fixtures.
