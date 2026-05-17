import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export const isSupabaseConfigured =
  !SUPABASE_URL.includes('placeholder') && !SUPABASE_ANON.includes('placeholder');

// ── Profile helpers ──────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function addXP(userId: string, amount: number) {
  const { error } = await supabase.rpc('add_xp', { user_id: userId, amount });
  if (error) throw error;
}

export async function saveScore(payload: {
  user_id: string;
  mode: string;
  total: number;
  scores: Record<string, Record<string, number | null>>;
}) {
  const { error } = await supabase.from('games').insert({
    ...payload,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}
