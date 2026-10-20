# Calculation / domain rules

周期支持 once / weekly / every_n_weeks / monthly / quarterly / yearly；按原始锚定日期生成付款实例；月末 29/30/31 日使用 last_day_of_month 或 clamp 明确策略；时区默认 America/Toronto，通知在本地时区调度；支付以实例而非模板为单位记录；金额 BigDecimal、ISO currency；避免分页重复实例。

## General finance invariants
- `money` is ISO 4217 currency + decimal amount rounded only at documented posting boundary.
- Persist explicit `calculation_version`, `assumptions`, and `as_of_date` per scenario.
- Negative balances are forbidden except for explicit credits; ending payoff balance clamps to exact zero without phantom excess interest.
- Backdated edits trigger complete deterministic replay.
- Reject undefined situations and show a human-friendly explanation instead of silently guessing.
- User-entered lender/issuer contract terms take precedence over generic defaults.

## Authoritative references to check at implementation/release
- FCAC credit cards and paying down balances: https://www.canada.ca/en/financial-consumer-agency/services/credit-cards/pay-off-credit-card.html
- FCAC mortgage prepayment rights: https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-mortgages/rights-prepayments.html
- FCAC mortgage terms and amortization: https://www.canada.ca/en/financial-consumer-agency/services/mortgages/mortgage-terms-amortization.html
- Specific bank agreement overrides generic assumption; verify provincial and federal rules as of release date.

