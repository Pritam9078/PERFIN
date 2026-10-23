import type { Metadata } from 'next';
import { requireUser } from '@/lib/services/auth';
import { listCategories } from '@/lib/services/categories';
import { PageHeader } from '@/components/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { ProfileForm, PasswordForm, CategoryManager } from '@/components/forms/settings-forms';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { supabase, user, profile } = await requireUser();
  const categories = await listCategories(supabase);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" subtitle={user.email ?? ''} />
      <Card tilt={false}><CardTitle>Profile and preferences</CardTitle><ProfileForm defaults={{ full_name: profile.full_name ?? '', currency: profile.currency as any, timezone: profile.timezone }} /></Card>
      <Card tilt={false}><CardTitle>Custom categories</CardTitle><CategoryManager categories={categories} /></Card>
      <Card tilt={false}><CardTitle>Password</CardTitle><PasswordForm /></Card>
    </div>
  );
}
