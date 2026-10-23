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
