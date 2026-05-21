import { supabase } from './supabase'

// Fetches the catalog of available quests from public.quests, ordered for
// display. RLS policy on the table already filters out inactive rows for
// authenticated users, but we keep the explicit eq('active', true) here so
// the contract is obvious at the call site.
export async function listAllQuests() {
  const { data, error } = await supabase
    .from('quests')
    .select('id, kind, title, description, xp_reward, duration_min, unlock_level, route, color_token, icon_token, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}
