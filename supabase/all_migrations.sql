-- PERFIN: core schema
create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text not null default 'INR' check (currency in ('INR','USD','EUR','GBP','JPY','AUD','CAD','SGD','AED')),
  timezone text not null default 'Asia/Kolkata',
  alert_thresholds int[] not null default '{75,90,100}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data->>'full_name','')), ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  type text not null check (type in ('income','expense')),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  check ((user_id is null) = is_default)
);
create unique index categories_default_unique on public.categories (lower(name), type) where user_id is null;
create unique index categories_user_unique on public.categories (user_id, lower(name), type) where user_id is not null;
create index categories_user_idx on public.categories (user_id);

-- ---------- transactions ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title text not null check (char_length(trim(title)) between 1 and 120),
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  transaction_date date not null,
  payment_method text,
  merchant text,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tx_user_date_idx on public.transactions (user_id, transaction_date desc);
create index tx_user_type_date_idx on public.transactions (user_id, type, transaction_date);
create index tx_user_category_date_idx on public.transactions (user_id, category_id, transaction_date);
create trigger trg_tx_updated before update on public.transactions
  for each row execute function public.set_updated_at();

-- category must match type and be default-or-owned
create or replace function public.validate_transaction_category()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare c record;
begin
  select user_id, type into c from public.categories where id = new.category_id;
  if not found then raise exception 'Category does not exist'; end if;
  if c.user_id is not null and c.user_id <> new.user_id then
    raise exception 'Category does not belong to this user';
  end if;
  if c.type <> new.type then
    raise exception 'Category type (%) does not match transaction type (%)', c.type, new.type;
  end if;
  return new;
end $$;
create trigger trg_tx_validate_category before insert or update on public.transactions
  for each row execute function public.validate_transaction_category();

-- ---------- budgets ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  period_start date not null,
  period_end date not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (user_id, category_id, period_start, period_end)
);
create index budgets_user_period_idx on public.budgets (user_id, period_start);
create trigger trg_budgets_updated before update on public.budgets
  for each row execute function public.set_updated_at();

create or replace function public.validate_budget_category()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare c record;
begin
  select user_id, type into c from public.categories where id = new.category_id;
  if not found then raise exception 'Category does not exist'; end if;
  if c.user_id is not null and c.user_id <> new.user_id then
    raise exception 'Category does not belong to this user';
  end if;
  if c.type <> 'expense' then raise exception 'Budgets can only target expense categories'; end if;
  return new;
end $$;
create trigger trg_budget_validate_category before insert or update on public.budgets
  for each row execute function public.validate_budget_category();

-- ---------- savings goals ----------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  description text,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_status_idx on public.savings_goals (user_id, status);
create trigger trg_goals_updated before update on public.savings_goals
  for each row execute function public.set_updated_at();
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
-- Default global categories (idempotent)
insert into public.categories (user_id, name, type, icon, color, is_default) values
 (null,'Salary','income','Briefcase','#D4FF3A',true),
 (null,'Freelance','income','Laptop','#9BE564',true),
 (null,'Investments','income','TrendingUp','#34D399',true),
 (null,'Gifts','income','Gift','#5EEAD4',true),
 (null,'Other income','income','CirclePlus','#A3A3A3',true),
 (null,'Food & Dining','expense','Utensils','#D4FF3A',true),
 (null,'Groceries','expense','ShoppingBasket','#A3E635',true),
 (null,'Transport','expense','Car','#22D3EE',true),
 (null,'Rent & Housing','expense','Home','#FB7185',true),
 (null,'Utilities','expense','Zap','#FBBF24',true),
 (null,'Shopping','expense','ShoppingBag','#F472B6',true),
 (null,'Health','expense','HeartPulse','#F87171',true),
 (null,'Entertainment','expense','Clapperboard','#A78BFA',true),
 (null,'Education','expense','GraduationCap','#60A5FA',true),
 (null,'Travel','expense','Plane','#2DD4BF',true),
 (null,'Subscriptions','expense','Repeat','#C084FC',true),
 (null,'Other expense','expense','CircleEllipsis','#A3A3A3',true)
on conflict (lower(name), type) where user_id is null do nothing;
-- Totals for the current transaction filter (so the UI never loads all rows to sum them)
create or replace function public.transaction_totals(
  p_type text default null, p_category uuid default null, p_from date default null,
  p_to date default null, p_method text default null, p_search text default null
)
returns table (income numeric, expenses numeric, tx_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0)::numeric,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric,
    count(*)
  from public.transactions
  where user_id = auth.uid()
    and (p_type is null or type = p_type)
    and (p_category is null or category_id = p_category)
    and (p_from is null or transaction_date >= p_from)
    and (p_to is null or transaction_date <= p_to)
    and (p_method is null or payment_method = p_method)
    and (p_search is null or title ilike '%' || replace(replace(replace(p_search,'\','\\'),'%','\%'),'_','\_') || '%'
         or merchant ilike '%' || replace(replace(replace(p_search,'\','\\'),'%','\%'),'_','\_') || '%');
$$;
revoke all on function public.transaction_totals(text,uuid,date,date,text,text) from public, anon;
grant execute on function public.transaction_totals(text,uuid,date,date,text,text) to authenticated;
