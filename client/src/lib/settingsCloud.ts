import { supabase } from '@/lib/supabase';
import type { AppSettings } from '@/db/gymbud-db';

const KEY = 'gymbud_settings_v1';

export async function loadCloudSettings(): Promise<AppSettings | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const cloud = (user.user_metadata?.[KEY]) as AppSettings | undefined;
  return cloud ?? null;
}

export async function saveCloudSettings(s: AppSettings): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ data: { [KEY]: s } });
  return !error;
}
