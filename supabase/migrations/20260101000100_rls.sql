-- PERFIN: Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));

-- categories: read defaults + own; write only own custom
create policy categories_select on public.categories for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy categories_insert on public.categories for insert to authenticated
  with check (user_id = (select auth.uid()) and is_default = false);
create policy categories_update on public.categories for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and is_default = false);
create policy categories_delete on public.categories for delete to authenticated
  using (user_id = (select auth.uid()));

-- transactions
create policy tx_select on public.transactions for select to authenticated using (user_id = (select auth.uid()));
create policy tx_insert on public.transactions for insert to authenticated with check (user_id = (select auth.uid()));
create policy tx_update on public.transactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy tx_delete on public.transactions for delete to authenticated using (user_id = (select auth.uid()));

-- budgets
create policy budgets_select on public.budgets for select to authenticated using (user_id = (select auth.uid()));
create policy budgets_insert on public.budgets for insert to authenticated with check (user_id = (select auth.uid()));
create policy budgets_update on public.budgets for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy budgets_delete on public.budgets for delete to authenticated using (user_id = (select auth.uid()));

-- savings goals
create policy goals_select on public.savings_goals for select to authenticated using (user_id = (select auth.uid()));
create policy goals_insert on public.savings_goals for insert to authenticated with check (user_id = (select auth.uid()));
create policy goals_update on public.savings_goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy goals_delete on public.savings_goals for delete to authenticated using (user_id = (select auth.uid()));

-- lock down privileged helpers
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_transaction_category() from public, anon, authenticated;
revoke all on function public.validate_budget_category() from public, anon, authenticated;
