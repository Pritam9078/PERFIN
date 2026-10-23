import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

/** Validates the session with Supabase Auth; redirects to /login when absent. */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('id, full_name, currency, timezone, alert_thresholds').eq('id', user.id).single();
  const p: Profile = profile ?? { id: user.id, full_name: null, currency: 'INR', timezone: 'Asia/Kolkata', alert_thresholds: [75, 90, 100] };
  return { supabase, user, profile: p };
}

/** For server actions: returns null instead of redirecting. */
export async function getActionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}
