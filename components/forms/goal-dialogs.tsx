'use client';
import { useState, useTransition } from 'react';
import { Plus, Pencil, PiggyBank, Archive, ArchiveRestore } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { saveGoalAction, addGoalFundsAction, setGoalArchivedAction } from '@/app/actions';
import { goalSchema, goalFundsSchema } from '@/lib/validations';
import type { Goal } from '@/lib/types';

type G = z.infer<typeof goalSchema>;

export function GoalDialog({ goal }: { goal?: Goal }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<G>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? { name: goal.name, target_amount: goal.target_amount.toFixed(2), current_amount: goal.current_amount.toFixed(2), target_date: goal.target_date ?? '', description: goal.description ?? '' } : { name: '', target_amount: '', current_amount: '', target_date: '', description: '' },
  });
  const submit = handleSubmit((v) => {
    if (pending) return;
    start(async () => {
      const r = await saveGoalAction(v, goal?.id);
      if (r.ok) { toast.success(r.message); setOpen(false); if (!goal) reset(); return; }
      Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) => setError(k as keyof G, { message: m[0] }));
      toast.error(r.error);
    });
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {goal ? <Button variant="ghost" size="icon" aria-label={`Edit ${goal.name}`}><Pencil className="h-4 w-4" /></Button> : <Button><Plus className="h-4 w-4" />New goal</Button>}
      </DialogTrigger>
      <DialogContent title={goal ? 'Edit goal' : 'New savings goal'}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Goal name" htmlFor="g_name" error={errors.name?.message}><Input id="g_name" aria-invalid={!!errors.name} {...register('name')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target amount" htmlFor="g_target" error={errors.target_amount?.message}><Input id="g_target" inputMode="decimal" aria-invalid={!!errors.target_amount} {...register('target_amount')} /></Field>
            <Field label="Saved so far" htmlFor="g_current" error={errors.current_amount?.message}><Input id="g_current" inputMode="decimal" {...register('current_amount')} /></Field>
          </div>
          <Field label="Target date (optional)" htmlFor="g_date" error={errors.target_date?.message}><Input id="g_date" type="date" {...register('target_date')} /></Field>
          <Field label="Description (optional)" htmlFor="g_desc" error={errors.description?.message}><Textarea id="g_desc" {...register('description')} /></Field>
          <Button type="submit" className="w-full" loading={pending}>{pending ? 'Saving' : 'Save goal'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddFundsDialog({ goalId, name }: { goalId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<{ amount: string }>({ resolver: zodResolver(goalFundsSchema), defaultValues: { amount: '' } });
  const submit = handleSubmit((v) => {
    if (pending) return;
    start(async () => {
      const r = await addGoalFundsAction(goalId, v);
      if (r.ok) { toast.success(r.message); setOpen(false); reset(); return; }
      setError('amount', { message: r.fieldErrors?.amount?.[0] ?? r.error });
    });
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><PiggyBank className="h-4 w-4" />Add funds</Button></DialogTrigger>
      <DialogContent title={`Add to ${name}`} description="Only amounts you enter here count toward this goal.">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Amount" htmlFor="f_amount" error={errors.amount?.message}><Input id="f_amount" inputMode="decimal" aria-invalid={!!errors.amount} {...register('amount')} /></Field>
          <Button type="submit" className="w-full" loading={pending}>{pending ? 'Adding' : 'Add funds'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ArchiveButton({ goalId, archived }: { goalId: string; archived: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" loading={pending} onClick={() => start(async () => { const r = await setGoalArchivedAction(goalId, !archived); r.ok ? toast.success(r.message) : toast.error(r.error); })}>
      {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{archived ? 'Restore' : 'Archive'}
    </Button>
  );
}
