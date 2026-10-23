'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { loginAction, signupAction, forgotPasswordAction } from '@/app/actions';
import { loginSchema, signupSchema, forgotSchema } from '@/lib/validations';

type Mode = 'login' | 'signup' | 'forgot';
const schemas = { login: loginSchema, signup: signupSchema, forgot: forgotSchema } as const;
const copy = {
  login: { cta: 'Sign in', pending: 'Signing in' },
  signup: { cta: 'Create account', pending: 'Creating account' },
  forgot: { cta: 'Send reset link', pending: 'Sending link' },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const next = useSearchParams().get('next') ?? undefined;
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<any>({ resolver: zodResolver(schemas[mode] as any) });

  const submit = handleSubmit((values) => {
    setFormError(null); setNotice(null);
    start(async () => {
      const res = mode === 'login' ? await loginAction(values, next) : mode === 'signup' ? await signupAction(values) : await forgotPasswordAction(values);
      if (!res) return; // redirected
      if (!res.ok) {
        setFormError(res.error);
        Object.entries(res.fieldErrors ?? {}).forEach(([k, v]) => setError(k, { message: v[0] }));
        toast.error(res.error);
      } else if (res.message) setNotice(res.message);
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {mode === 'signup' && (
        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message as string}>
          <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} {...register('full_name')} />
        </Field>
      )}
      <Field label="Email" htmlFor="email" error={errors.email?.message as string}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
      </Field>
      {mode !== 'forgot' && (
        <Field label="Password" htmlFor="password" error={errors.password?.message as string} hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
          <PasswordInput id="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-invalid={!!errors.password} {...register('password')} />
        </Field>
      )}
      {formError && <p role="alert" className="rounded-chip border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{formError}</p>}
      {notice && <p role="status" className="rounded-chip border border-lime/30 bg-lime/10 px-4 py-3 text-sm text-lime">{notice}</p>}
      <Button type="submit" className="w-full" loading={pending}>{pending ? copy[mode].pending : copy[mode].cta}</Button>
      <div className="flex justify-between text-sm text-mute">
        {mode === 'login' && <><Link href="/forgot-password" className="hover:text-white">Forgot password?</Link><Link href="/signup" className="hover:text-white">Create an account</Link></>}
        {mode === 'signup' && <Link href="/login" className="hover:text-white">Already have an account? Sign in</Link>}
        {mode === 'forgot' && <Link href="/login" className="hover:text-white">Back to sign in</Link>}
      </div>
    </form>
  );
}
