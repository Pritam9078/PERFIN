# Manual end-to-end checklist
Run against a real Supabase project after applying migrations.

- [ ] Sign up with a new email, confirm (if enabled), land on /dashboard with an empty-state card.
- [ ] Sign out, sign in again. Visit /dashboard signed out: redirected to /login?next=/dashboard. Visit /login signed in: redirected to /dashboard.
- [ ] Forgot password sends an email and shows the same message for unknown emails.
- [ ] Add an income and two expenses. Refresh: they persist. Dashboard totals, donut, cash flow and recent list match.
- [ ] Edit an expense amount: dashboard income/expense/net and budget bars update. Delete it (confirm dialog): totals update.
- [ ] Create a budget for a category this month; add expenses to cross 75%, 90%, 100%: bar colour, message and bell alert change. Creating a duplicate budget shows a friendly error.
- [ ] Transactions: search by title and merchant; filter by type/category/date/method; sort by each column; paginate (add >15 rows); filter totals match the rows.
- [ ] Export CSV with filters applied: file contains only the filtered rows.
- [ ] Create a goal, add funds, reach target (status completes), archive and restore.
- [ ] Settings: change currency to USD and timezone: amounts and "today" update. Add and delete a custom category (deletion blocked when in use).
- [ ] Second account: cannot see the first account's data; /transactions/<other-id>/edit returns 404.
- [ ] Month switcher: prior month shows comparison deltas; months with no data show "No prior month"/empty states, no errors.
- [ ] Mobile (~375px): bottom nav, tables scroll horizontally, dialogs fit, FAB doesn't cover content.
- [ ] Keyboard only: skip link, tab through nav, dialogs trap focus and close on Esc.
- [ ] OS "reduce motion" on: no tilt, parallax or entrance animation.
