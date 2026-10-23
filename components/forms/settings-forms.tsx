'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput, Select } from '@/components/ui/field';
import { ConfirmDelete } from '@/components/confirm-delete';
import { updateProfileAction, updatePasswordAction, createCategoryAction, deleteCategoryAction } from '@/app/actions';
import { profileSchema, resetSchema, customCategorySchema } from '@/lib/validations';
import { CURRENCIES } from '@/lib/utils';
import type { Category } from '@/lib/types';

type P = z.infer<typeof profileSchema>;
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'];

export function ProfileForm({ defaults }: { defaults: P }) {
  const [pending, start] = useTransition();
  const tzs = TIMEZONES.includes(defaults.timezone) ? TIMEZONES : [defaults.timezone, ...TIMEZONES];
  const { register, handleSubmit, setError, formState: { errors, isDirty } } = useForm<P>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  const submit = handleSubmit((v) => { if (pending) return; start(async () => {
    const r = await updateProfileAction(v);
    if (r.ok) toast.success(r.message); else { Object.entries(r.fieldErrors ?? {}).forEach(([k, m]) => setError(k as keyof P, { message: m[0] })); toast.error(r.error); }
  }); });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Full name" htmlFor="s_name" error={errors.full_name?.message}><Input id="s_name" autoComplete="name" {...register('full_name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Currency" htmlFor="s_cur" error={errors.currency?.message}><Select id="s_cur" {...register('currency')}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Timezone" htmlFor="s_tz" hint="Sets month boundaries and today's date" error={errors.timezone?.message}><Select id="s_tz" {...register('timezone')}>{tzs.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
      </div>
      <Button type="submit" loading={pending} disabled={!isDirty}>{pending ? 'Saving' : 'Save changes'}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [pending, start] = useTransition();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<{ password: string }>({ resolver: zodResolver(resetSchema), defaultValues: { password: '' } });
  const submit = handleSubmit((v) => { if (pending) return; start(async () => {
    const r = await updatePasswordAction(v);
    if (r.ok) { toast.success(r.message); reset(); } else { setError('password', { message: r.error }); toast.error(r.error); }
  }); });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="New password" htmlFor="s_pw" hint="At least 8 characters" error={errors.password?.message}><PasswordInput id="s_pw" autoComplete="new-password" {...register('password')} /></Field>
      <Button type="submit" variant="secondary" loading={pending}>{pending ? 'Updating' : 'Update password'}</Button>
    </form>
  );
}

type C = z.infer<typeof customCategorySchema>;
export function CategoryManager({ categories }: { categories: Category[] }) {
  const [pending, start] = useTransition();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<C>({ resolver: zodResolver(customCategorySchema), defaultValues: { name: '', type: 'expense' } });
  const [, force] = useState(0);
  const submit = handleSubmit((v) => { if (pending) return; start(async () => {
    const r = await createCategoryAction(v);
    if (r.ok) { toast.success(r.message); reset({ name: '', type: v.type }); force((n) => n + 1); } else { setError('name', { message: r.error }); toast.error(r.error); }
  }); });
  const mine = categories.filter((c) => !c.is_default);
  return (
    <div className="space-y-4">
      <form onSubmit={submit} noValidate className="flex flex-wrap items-start gap-3">
        <Field label="Category name" htmlFor="c_name" error={errors.name?.message} className="min-w-[10rem] flex-1"><Input id="c_name" {...register('name')} /></Field>
        <Field label="Type" htmlFor="c_type"><Select id="c_type" {...register('type')}><option value="expense">Expense</option><option value="income">Income</option></Select></Field>
        <Button type="submit" className="mt-[1.75rem]" loading={pending}>Add category</Button>
      </form>
      {mine.length === 0 ? <p className="text-sm text-mute">You have not added custom categories. The built-in ones are always available.</p> : (
        <ul className="divide-y divide-line">{mine.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm"><span>{c.name} <span className="text-mute">· {c.type}</span></span>
            <ConfirmDelete label={`Delete ${c.name}`} title="Delete this category?" body="Categories with transactions or budgets cannot be deleted." onConfirm={() => deleteCategoryAction(c.id)} /></li>
        ))}</ul>
      )}
    </div>
  );
}
