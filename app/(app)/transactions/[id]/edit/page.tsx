import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/services/auth';
import { listCategories } from '@/lib/services/categories';
import { getTransaction } from '@/lib/services/transactions';
import { todayInTz } from '@/lib/dates';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { TransactionForm } from '@/components/forms/transaction-form';

export const metadata: Metadata = { title: 'Edit transaction' };

export default async function EditTransaction({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, profile } = await requireUser();
  const [tx, categories] = await Promise.all([getTransaction(supabase, id), listCategories(supabase)]);
  if (!tx) notFound(); // RLS hides other users' rows, so they 404 too
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit transaction" />
      <Card tilt={false}>
        <TransactionForm id={tx.id} categories={categories} today={todayInTz(profile.timezone)} defaults={{
          type: tx.type, title: tx.title, amount: tx.amount.toFixed(2), category_id: tx.category_id, transaction_date: tx.transaction_date,
          payment_method: tx.payment_method ?? '', merchant: tx.merchant ?? '', notes: tx.notes ?? '', tags: tx.tags.join(', '),
        }} />
      </Card>
    </div>
  );
}
