import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowDown, ArrowUp, Download, Pencil, Plus } from 'lucide-react';
import { requireUser } from '@/lib/services/auth';
import { listCategories } from '@/lib/services/categories';
import { listTransactions, PAGE_SIZE } from '@/lib/services/transactions';
import { transactionFiltersSchema, PAYMENT_METHODS } from '@/lib/validations';
import { deleteTransactionAction } from '@/app/actions';
import { formatCurrency, cn } from '@/lib/utils';
import { formatDay } from '@/lib/dates';
import { PageHeader } from '@/components/page-header';
import { Card, EmptyState, ErrorState } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { ConfirmDelete } from '@/components/confirm-delete';
import { CategoryIcon } from '@/components/category-icon';

export const metadata: Metadata = { title: 'Transactions' };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v)); // empty strings => unset
  const parsed = transactionFiltersSchema.safeParse(clean);
  const f = parsed.success ? parsed.data : transactionFiltersSchema.parse({});
  const { supabase, profile } = await requireUser();
  const cur = profile.currency;

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ ...f, page: undefined, ...over }).forEach(([k, v]) => { if (v !== undefined && v !== '' && !(k === 'sort' && v === 'transaction_date' && !('sort' in over)) && !(k === 'dir' && v === 'desc' && !('dir' in over))) p.set(k, String(v)); });
    return p.toString();
  };
  const sortHref = (col: string) => `/transactions?${qs({ sort: col, dir: f.sort === col && f.dir === 'desc' ? 'asc' : 'desc' })}`;

  let result, categories;
  try { [result, categories] = await Promise.all([listTransactions(supabase, f), listCategories(supabase)]); }
  catch { return <><PageHeader title="Transactions" /><ErrorState /></>; }
  const { rows, count, pages, totals } = result;
  const hasFilters = !!(f.q || f.type || f.category || f.method || f.from || f.to);
  const SortHead = ({ col, label, right }: { col: string; label: string; right?: boolean }) => (
    <th scope="col" aria-sort={f.sort === col ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('px-4 py-3 font-medium', right && 'text-right')}>
      <Link href={sortHref(col)} className="inline-flex items-center gap-1 hover:text-white">{label}{f.sort === col && (f.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</Link>
    </th>
  );

  return (
    <>
      <PageHeader title="Transactions" subtitle={`${count} ${count === 1 ? 'transaction' : 'transactions'}${hasFilters ? ' match your filters' : ''}`}>
        <Button asChild variant="secondary"><a href={`/transactions/export?${qs({ page: undefined })}`}><Download className="h-4 w-4" />Export CSV</a></Button>
        <Button asChild><Link href="/transactions/new"><Plus className="h-4 w-4" />Add transaction</Link></Button>
      </PageHeader>

      <Card tilt={false} className="mb-4">
        <form method="get" action="/transactions" role="search" aria-label="Filter transactions" className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <Input name="q" defaultValue={f.q} placeholder="Search title or merchant" aria-label="Search" className="sm:col-span-2 xl:col-span-2" />
          <Select name="type" defaultValue={f.type ?? ''} aria-label="Type"><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></Select>
          <Select name="category" defaultValue={f.category ?? ''} aria-label="Category"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}</Select>
          <Select name="method" defaultValue={f.method ?? ''} aria-label="Payment method"><option value="">Any method</option>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-1">
            <Input type="date" name="from" defaultValue={f.from} aria-label="From date" title="From date" className="px-2 text-xs" />
            <Input type="date" name="to" defaultValue={f.to} aria-label="To date" title="To date" className="px-2 text-xs" />
          </div>
          <input type="hidden" name="sort" value={f.sort} /><input type="hidden" name="dir" value={f.dir} />
          <div className="flex gap-2 sm:col-span-2 md:col-span-3 xl:col-span-6 pt-1">
            <Button type="submit" size="sm">Apply filters</Button>
            {hasFilters && <Button asChild variant="ghost" size="sm"><Link href="/transactions">Clear</Link></Button>}
          </div>
        </form>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <div className="surface rounded-2xl p-4"><p className="text-mute">Income</p><p className="mt-1 text-lg font-bold text-lime">{formatCurrency(totals.income, cur)}</p></div>
        <div className="surface rounded-2xl p-4"><p className="text-mute">Expenses</p><p className="mt-1 text-lg font-bold text-coral">{formatCurrency(totals.expenses, cur)}</p></div>
        <div className="surface rounded-2xl p-4"><p className="text-mute">Net</p><p className="mt-1 text-lg font-bold">{formatCurrency(totals.income - totals.expenses, cur)}</p></div>
      </div>

      <Card tilt={false} className="p-0 sm:p-0">
        {rows.length === 0 ? (
          <EmptyState title={hasFilters ? 'Nothing matches those filters' : 'No transactions yet'} body={hasFilters ? 'Try widening the date range or clearing a filter.' : 'Add your first transaction to start building your picture.'}
            action={hasFilters ? <Button asChild variant="secondary" size="sm"><Link href="/transactions">Clear filters</Link></Button> : <Button asChild size="sm"><Link href="/transactions/new">Add transaction</Link></Button>} />
        ) : (
          <div className="scroll-x">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-mute"><tr className="border-b border-line">
                <SortHead col="transaction_date" label="Date" /><SortHead col="title" label="Title" />
                <th scope="col" className="px-4 py-3 font-medium">Category</th><th scope="col" className="px-4 py-3 font-medium">Method</th>
                <SortHead col="amount" label="Amount" right /><th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-mute">{formatDay(t.transaction_date)}</td>
                    <td className="px-4 py-3"><p className="font-semibold">{t.title}</p>{t.merchant && <p className="text-xs text-mute">{t.merchant}</p>}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><CategoryIcon name={t.category?.icon} color={t.category?.color} className="h-4 w-4" />{t.category?.name}</span></td>
                    <td className="px-4 py-3 text-mute">{t.payment_method ?? '–'}</td>
                    <td className={cn('whitespace-nowrap px-4 py-3 text-right font-bold', t.type === 'income' ? 'text-lime' : 'text-white')}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, cur)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      <Button asChild variant="ghost" size="icon"><Link href={`/transactions/${t.id}/edit`} aria-label={`Edit ${t.title}`}><Pencil className="h-4 w-4" /></Link></Button>
                      <ConfirmDelete label={`Delete ${t.title}`} title="Delete this transaction?" body={`“${t.title}” will be removed and your totals will update. This cannot be undone.`} onConfirm={async () => { 'use server'; return deleteTransactionAction(t.id); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <p className="text-mute">Page {f.page} of {pages} · {PAGE_SIZE} per page</p>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm" className={f.page <= 1 ? 'pointer-events-none opacity-40' : ''}><Link href={`/transactions?${qs({ page: f.page - 1 })}`} aria-disabled={f.page <= 1}>Previous</Link></Button>
            <Button asChild variant="secondary" size="sm" className={f.page >= pages ? 'pointer-events-none opacity-40' : ''}><Link href={`/transactions?${qs({ page: f.page + 1 })}`} aria-disabled={f.page >= pages}>Next</Link></Button>
          </div>
        </nav>
      )}
    </>
  );
}
