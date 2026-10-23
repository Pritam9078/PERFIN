import type { Metadata } from 'next';
import { requireUser } from '@/lib/services/auth';
import { listCategories } from '@/lib/services/categories';
import { todayInTz } from '@/lib/dates';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { TransactionForm } from '@/components/forms/transaction-form';

export const metadata: Metadata = { title: 'Add transaction' };

export default async function NewTransaction({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { supabase, profile } = await requireUser();
  const type = (await searchParams).type === 'income' ? 'income' : 'expense';
  const categories = await listCategories(supabase);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add transaction" subtitle="Record money coming in or going out." />
      <Card tilt={false}><TransactionForm categories={categories} today={todayInTz(profile.timezone)} defaults={{ type }} /></Card>
    </div>
  );
}
