'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { saveTransactionAction } from '@/app/actions';
import { transactionSchema, PAYMENT_METHODS, type TransactionForm as Values } from '@/lib/validations';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TransactionForm({ categories, defaults, id, today }: { categories: Category[]; defaults?: Partial<Values>; id?: string; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, control, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'expense', transaction_date: today, title: '', amount: '', category_id: '', payment_method: '', merchant: '', notes: '', tags: '', ...defaults },
  });
  const type = watch('type');
  const options = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  const submit = handleSubmit((values) => {
    if (pending) return; // blocks double submit
    setFormError(null);
    start(async () => {
      const r = await saveTransactionAction(values, id);
      if (r.ok) { toast.success(r.message); router.push('/transactions'); router.refresh(); return; }
      setFormError(r.error);
      Object.entries(r.fieldErrors ?? {}).forEach(([k, v]) => setError(k as keyof Values, { message: v[0] }));
      toast.error(r.error);
    });
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(e); }} noValidate className="space-y-5">
      <Controller control={control} name="type" render={({ field }) => (
        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-full bg-raised p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={field.value === t}
              onClick={() => { field.onChange(t); setValue('category_id', ''); }}
              className={cn('rounded-full py-2.5 text-sm font-semibold transition-colors', field.value === t ? (t === 'income' ? 'bg-lime text-ink' : 'bg-coral text-ink') : 'text-white/60 hover:text-white')}>
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>
      )} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={errors.title?.message} className="sm:col-span-2">
          <Input id="title" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} {...register('title')} />
        </Field>
        <Field label="Amount" htmlFor="amount" error={errors.amount?.message}>
          <Input id="amount" inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.amount} {...register('amount')} />
        </Field>
        <Field label="Date" htmlFor="transaction_date" error={errors.transaction_date?.message}>
          <Input id="transaction_date" type="date" aria-invalid={!!errors.transaction_date} {...register('transaction_date')} />
        </Field>
        <Field label="Category" htmlFor="category_id" error={errors.category_id?.message}>
          <Select id="category_id" aria-invalid={!!errors.category_id} {...register('category_id')}>
            <option value="">Choose a category</option>
            {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Payment method" htmlFor="payment_method" error={errors.payment_method?.message}>
          <Select id="payment_method" {...register('payment_method')}>
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Merchant or payee" htmlFor="merchant" error={errors.merchant?.message}>
          <Input id="merchant" {...register('merchant')} />
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Separate with commas" error={errors.tags?.message}>
          <Input id="tags" placeholder="trip, work" {...register('tags')} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2">
          <Textarea id="notes" {...register('notes')} />
        </Field>
      </div>
      {formError && <p role="alert" className="rounded-chip border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{formError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        <Button type="submit" loading={pending}>{pending ? 'Saving' : id ? 'Save changes' : 'Add transaction'}</Button>
      </div>
    </form>
  );
}
