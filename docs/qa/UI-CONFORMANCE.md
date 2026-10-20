# UI conformance and verification status

References: root ui_frames.png, ui/01-dashboard.png through ui/05-insights.png, and the user-supplied 2026-10-19 screenshot. The supplied concept depicts twelve mobile states supporting five principal pages.

Implemented mappings:

| Reference | Implementation |
|---|---|
| Welcome / sign in | Auth.tsx: leaf mark, serif wordmark, ivory field, forest/lake illustration, green primary action, distinct sign-in form |
| Home dashboard | Dashboard.tsx: green 30-day card, three counts, icon payment rows, calm note, bottom navigation |
| Bills list | Bills.tsx: bill/subscription tabs, status and search, recurrence/next-due text, duplicate flags |
| Bill detail | Bills.tsx: centered icon/amount, status, separate fact cards, edit/pause and occurrence timeline |
| Calendar | Calendar.tsx: month navigation, seven-column calendar, numbered badges and textual overdue indicator, occurrence list, month/list toggle |
| Bill / subscription editor | Editor.tsx: two tabs, amount/currency, due date/frequency, category, month-end strategy, reminders, notes and validation |
| Reminders | Settings.tsx: actual local-day reminders, per-occurrence pay/undo, explicit in-app channel |
| Insights / categories | Insights.tsx: spending/trends/categories tabs, scheduled totals, bar and donut charts, currency-separated exact values |
| Settings | Settings.tsx: account, timezone/currency/locale, exports, privacy and reauthenticated deletion |

Mobile uses 375px-first compact cards, icon rows, 16px page inset and fixed five-action navigation. Desktop uses a side rail and two-column layout. The brand uses #295B46, #FAF8F3 and #263332. Reduced-motion disables CSS animation; financial charts do not animate. Status always has text.

Intentional truthfulness constraints: no OAuth buttons without providers, no linked banking accounts, no invented past-spending percentage, no push/email promises. Monetary illustrations are not copied as customer data.

Verification — 2026-10-20: T12 passes. Clean production browser suite 6/6, plus the final offline-style regression 2/2, zero failures/skips/flaky cases. Reports: e2e-core-results.json and e2e-results.json. Desktop/mobile primary states and 768px tablet primary pages pass axe WCAG A/AA and overflow checks. Keyboard skip-link/focus, reduced motion, offline indication, export JSON contents, deletion and screen-reader semantic labels are covered. Screenshots for primary desktop/mobile pages, tablet calendar/editor, and the final offline page were visually inspected against the concept. Real VoiceOver/NVDA speech certification and pixel identity to the concept are not claimed.

Fixed after verification: two low-contrast text colors, detached session observer on logout/deletion, and offline CSS not being served from the service-worker cache. Full-page captures may show the fixed navigation over the capture scroll position; all primary-page overflow assertions pass.

T13 release-image/strict-scan/hosted-operation gates remain blocked; see SECURITY-REVIEW.md and PROGRESS.md. QA evidence does not represent public deployment.
