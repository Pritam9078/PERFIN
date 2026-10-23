import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/forms/auth-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mb-6 mt-1 text-mute">Start tracking in under a minute.</p>
      <Suspense><AuthForm mode="signup" /></Suspense>
    </>
  );
}
