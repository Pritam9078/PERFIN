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
