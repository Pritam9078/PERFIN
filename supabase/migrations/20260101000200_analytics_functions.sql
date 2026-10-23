-- PERFIN: analytics RPCs. SECURITY INVOKER => RLS applies; we also filter on auth.uid() explicitly.

create or replace function public.period_totals(p_from date, p_to date)
returns table (income numeric, expenses numeric)
language sql stable security invoker set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0)::numeric,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric
  from public.transactions
  where user_id = auth.uid() and transaction_date between p_from and p_to;
$$;

-- all-time net (income - expenses) up to a date: "tracked balance", not a bank balance
create or replace function public.tracked_balance(p_until date)
returns numeric
language sql stable security invoker set search_path = ''
as $$
  select coalesce(sum(case when type = 'income' then amount else -amount end), 0)::numeric
  from public.transactions
  where user_id = auth.uid() and transaction_date <= p_until;
$$;

create or replace function public.category_breakdown(p_from date, p_to date, p_type text)
returns table (category_id uuid, name text, color text, icon text, total numeric, tx_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select c.id, c.name, c.color, c.icon, sum(t.amount)::numeric, count(*)
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.user_id = auth.uid() and t.type = p_type and t.transaction_date between p_from and p_to
  group by c.id, c.name, c.color, c.icon
  order by sum(t.amount) desc;
$$;

create or replace function public.daily_series(p_from date, p_to date)
returns table (day date, income numeric, expenses numeric)
language sql stable security invoker set search_path = ''
as $$
  select d::date,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric
  from generate_series(p_from, p_to, interval '1 day') d
  left join public.transactions t
    on t.user_id = auth.uid() and t.transaction_date = d::date
  group by d order by d;
$$;

create or replace function public.monthly_series(p_from date, p_to date)
returns table (month date, income numeric, expenses numeric)
language sql stable security invoker set search_path = ''
as $$
  select m::date,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric
  from generate_series(date_trunc('month', p_from::timestamp), date_trunc('month', p_to::timestamp), interval '1 month') m
  left join public.transactions t
    on t.user_id = auth.uid() and t.transaction_date >= m::date
   and t.transaction_date < (m + interval '1 month')::date
  group by m order by m;
$$;

-- budgets with spend derived from real transactions (never stored)
create or replace function public.budget_progress(p_start date, p_end date)
returns table (
  id uuid, category_id uuid, category_name text, category_color text,
  period_start date, period_end date, limit_amount numeric, spent numeric
)
language sql stable security invoker set search_path = ''
as $$
  select b.id, b.category_id, c.name, c.color, b.period_start, b.period_end, b.limit_amount,
    coalesce((
      select sum(t.amount) from public.transactions t
      where t.user_id = b.user_id and t.category_id = b.category_id and t.type = 'expense'
        and t.transaction_date between b.period_start and b.period_end
    ), 0)::numeric
  from public.budgets b
  join public.categories c on c.id = b.category_id
  where b.user_id = auth.uid() and b.period_start >= p_start and b.period_end <= p_end
  order by c.name;
$$;

revoke all on function public.period_totals(date,date), public.tracked_balance(date),
  public.category_breakdown(date,date,text), public.daily_series(date,date),
  public.monthly_series(date,date), public.budget_progress(date,date) from public, anon;
grant execute on function public.period_totals(date,date), public.tracked_balance(date),
  public.category_breakdown(date,date,text), public.daily_series(date,date),
  public.monthly_series(date,date), public.budget_progress(date,date) to authenticated;
