# Independent schedule and posting reference

Version schedule-1.0. These are synthetic test inputs, never market prices or customer outcomes.

Calendar reconciliation by Gregorian calendar rules:
- Jan 31 2025 monthly clamp → Jan 31, Feb 28, Mar 31. Always return to the original day after the short month.
- Jan 31 2024 → Feb 29 (2024 divisible by 4, not by 100).
- Feb 29 2024 yearly → Feb 28 2025; Feb 29 2028.
- Jan 31 quarterly → Apr 30; Jul 31.
- Mar 2 2025 weekly → Mar 9 → Mar 16, despite Toronto DST on Mar 9.
- Explicit last-day policy on Apr 15 → Apr 30 → May 31.

Posting boundary: ISO currency fraction digits, HALF_EVEN per occurrence, then add posted values within each currency. CAD 1.005 → 1.00; CAD 1.015 → 1.02; JPY 1.5 → 2. No FX conversion. Payment marks are user records, never bank confirmations.

Property fixture loops through 400 Gregorian years and days 28–31: exactly 12 distinct anchored monthly dates in each annual range. API tests reconcile paid snapshot retention on backdated edit and pause, plus deterministic replay and owner isolation.
