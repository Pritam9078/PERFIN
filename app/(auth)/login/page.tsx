import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/forms/auth-form';

export const metadata: Metadata = { title: 'Welcome back' };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mb-6 mt-1 text-mute">Sign in to see your money in perspective.</p>
      <Suspense><AuthForm mode="login" /></Suspense>
    </>
  );
}
