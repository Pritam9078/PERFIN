import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/forms/auth-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Reset your password</h1>
      <p className="mb-6 mt-1 text-mute">We will email you a link to set a new one.</p>
      <Suspense><AuthForm mode="forgot" /></Suspense>
    </>
  );
}
