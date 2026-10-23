# PERFIN: Your money, in perspective.

Personal expense tracker built with Next.js 15 (App Router, TypeScript), Tailwind CSS, Framer-free CSS motion, Recharts, React Hook Form + Zod, and Supabase (Postgres, Auth, Row Level Security).

> PERFIN tracks money you log. The "tracked balance" is all-time income minus expenses entered in the app. It is **not** synced with any bank.

## Prerequisites
- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) account (or the Supabase CLI + Docker for a local stack)

## 1. Install
```bash
npm install
cp .env.example .env.local
```

## 2. Create the Supabase project (manual step, needs your account)
1. Supabase Dashboard -> **New project**. Save the database password.
2. **Project Settings -> API**: copy the **Project URL** and the **anon / publishable key** into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Never put the `service_role` key in any `NEXT_PUBLIC_` variable.
3. **Authentication -> URL Configuration**: set *Site URL* to `http://localhost:3000` and add `http://localhost:3000/auth/callback` (and your production URL + `/auth/callback`) to *Redirect URLs*.
4. Optional for quick local testing: **Authentication -> Providers -> Email -> disable "Confirm email"**. Leave it on in production.

## 3. Run the migrations and seed
`supabase/migrations/` is the source of truth (schema, RLS, analytics functions, default categories).

**Option A: Supabase CLI (recommended)**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
**Option B: SQL editor**: paste and run each file in `supabase/migrations/` in filename order.

Default categories are inserted by the last migration (idempotent). `supabase/seed.sql` contains the same statements for `supabase db reset` on a local stack.

## 4. Run locally
```bash
npm run dev      # http://localhost:3000
```

## 5. Quality checks
```bash
npm run typecheck
npm run lint
npm test         # unit + validation tests (+ RLS tests if env is set)
npm run build
```
**RLS integration tests** talk to a real Supabase project and create two throwaway users. Use a dev/local project, never production:
```bash
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm test
```
Without those variables the 11 RLS tests are skipped. The service-role key is used only by the tests, never by the app.

See `TESTING.md` for the manual end-to-end checklist.

## 6. Deploy to Vercel
1. Push the repo to GitHub and import it in Vercel (framework: Next.js).
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (your Vercel URL).
3. In Supabase **Authentication -> URL Configuration**, add the Vercel URL and `<url>/auth/callback`.
4. Deploy. Run `supabase db push` against the production project before first use.

## Architecture
| Path | Purpose |
|---|---|
| `app/` | Routes. `(app)` is the authenticated area, `(auth)` the sign-in pages. |
| `app/actions.ts` | Server Actions: validate (Zod) -> authenticate -> user-scoped DB write -> revalidate |
| `lib/supabase/` | Browser/server clients and middleware session refresh + route protection |
| `lib/services/` | Data access (transactions, budgets, goals, categories, auth) |
| `lib/analytics/` | Calculations (pure, tested) and RPC-backed aggregation queries |
| `lib/validations/` | Zod schemas |
| `supabase/migrations/` | Tables, constraints, indexes, triggers, RLS, RPCs, seed |

**Security model:** every table has RLS. All access uses the signed-in user's JWT (anon key); no service-role key in the app. Analytics are `SECURITY INVOKER` SQL functions, so RLS applies. Triggers enforce that a transaction's category matches its type and is a default or the user's own. Budget spend is always derived from transactions, never stored.

## Design decisions
- Monthly savings = monthly income - monthly expenses. Tracked balance = all-time income - expenses up to the end of the selected month.
- Dates are `DATE` columns in the user's timezone (profile setting); month boundaries use that timezone.
- Savings goals use validated server-side "add funds" updates (no contribution history table); nothing is auto-linked to expenses.
- Budgets are one per user/category/calendar month (unique constraint).
