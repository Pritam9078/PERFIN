import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/lib/types';

export async function listCategories(sb: SupabaseClient): Promise<Category[]> {
  const { data, error } = await sb.from('categories').select('id, user_id, name, type, icon, color, is_default').order('type').order('name');
  if (error) throw error;
  return (data ?? []) as Category[];
}
