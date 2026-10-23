'use client';
import { useState, useTransition } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { saveBudgetAction } from '@/app/actions';
import { budgetSchema } from '@/lib/validations';
import { z } from 'zod';
import type { Category } from '@/lib/types';

type V = z.infer<typeof budgetSchema>;

export function BudgetDialog({ categories, month, budget }: { categories: Category[]; month: string; budget?: { id: string; category_id: string; limit_amount: number } }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<V>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { month, category_id: budget?.category_id ?? '', limit_amount: budget ? budget.limit_amount.toFixed(2) : '' },
  });
  const submit = handleSubmit((v) => {
    if (pending) return;
    start(async () => {
      const r = await saveBudgetAction(v, budget?.id);
      if (r.ok) { toast.success(r.message); setOpen(false); if (!budget) reset({ month, category_id: '', limit_amount: '' }); return; }
      Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) => setError(k as keyof V, { message: m[0] }));
      toast.error(r.error);
    });
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {budget ? <Button variant="ghost" size="icon" aria-label="Edit budget"><Pencil className="h-4 w-4" /></Button> : <Button><Plus className="h-4 w-4" />New budget</Button>}
      </DialogTrigger>
      <DialogContent title={budget ? 'Edit budget' : 'New budget'} description={`Monthly limit for ${month}`}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <input type="hidden" {...register('month')} />
          <Field label="Category" htmlFor="b_category" error={errors.category_id?.message}>
            <Select id="b_category" aria-invalid={!!errors.category_id} {...register('category_id')}>
              <option value="">Choose a category</option>
              {categories.filter((c) => c.type === 'expense').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Monthly limit" htmlFor="b_limit" error={errors.limit_amount?.message}>
            <Input id="b_limit" inputMode="decimal" aria-invalid={!!errors.limit_amount} {...register('limit_amount')} />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>{pending ? 'Saving' : 'Save budget'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
