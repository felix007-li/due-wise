# UI page-by-page implementation blueprint

Brand color `#295B46`, background warm ivory `#FAF8F3`, text ink `#263332`, card radius 16px; use restrained neutral accents. Design files `ui/01…05.png`. The screenshots are concept mockups, **not production-ready Figma source**.

## 01. Dashboard
- Goal: summary of bills due in 7 and 30 days; upcoming list, overdue flags, add quick action; no false Paid status.
- UI: top title and back/home, content cards, inline info, primary action, keyboard accessible controls.
- States: loading skeleton; empty setup prompt; success toast; validation guidance; error retry; mobile 375px and desktop two-column.

## 02. Bills & subscriptions
- Goal: filters by recurring type, active/paused, search, next due, edit/disable; duplicates are flagged.
- UI: top title and back/home, content cards, inline info, primary action, keyboard accessible controls.
- States: loading skeleton; empty setup prompt; success toast; validation guidance; error retry; mobile 375px and desktop two-column.

## 03. Calendar
- Goal: month and list views, date badges, paid/unpaid per occurrence, navigate to detail.
- UI: top title and back/home, content cards, inline info, primary action, keyboard accessible controls.
- States: loading skeleton; empty setup prompt; success toast; validation guidance; error retry; mobile 375px and desktop two-column.

## 04. Add/Edit Bill
- Goal: amount, currency, first due, recurrence, category, reminder offsets, month-end handling and save validation.
- UI: top title and back/home, content cards, inline info, primary action, keyboard accessible controls.
- States: loading skeleton; empty setup prompt; success toast; validation guidance; error retry; mobile 375px and desktop two-column.

## 05. Insights
- Goal: monthly commitments by category, subscription totals, upcoming cash needs, comparisons for complete historical periods.
- UI: top title and back/home, content cards, inline info, primary action, keyboard accessible controls.
- States: loading skeleton; empty setup prompt; success toast; validation guidance; error retry; mobile 375px and desktop two-column.

## Navigation
Dashboard → list/form or simulator → details/confirmation → saved history. All financial claims link to visible assumptions. Never color alone to convey status.
