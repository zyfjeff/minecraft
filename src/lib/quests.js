import { supabase } from './supabase'

// UTC date string (YYYY-MM-DD) — matches the DB default `(now() at time zone 'utc')::date`
// so client and server always agree on "today".
export function todayUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

// All active quests, ordered for UI consumption.
export async function listQuests() {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

// Today's completion records for a single user.
export async function listTodayCompletions(userId) {
  if (!userId) return []
  const today = todayUtcDate()
  const { data, error } = await supabase
    .from('quest_completions')
    .select('quest_id, xp_awarded, completed_on')
    .eq('user_id', userId)
    .eq('completed_on', today)
  if (error) throw error
  return data || []
}

// Atomic claim: relies on the (user_id, quest_id, completed_on) primary key
// to make double-claims a no-op. Caller updates profile.xp only when
// alreadyClaimed === false.
export async function insertCompletion(userId, quest) {
  if (!userId || !quest?.id) throw new Error('insertCompletion: missing userId/quest')
  const xp = Number(quest.xp_reward) || 0
  const { error } = await supabase
    .from('quest_completions')
    .insert({
      user_id: userId,
      quest_id: quest.id,
      completed_on: todayUtcDate(),
      xp_awarded: xp,
    })
  if (error) {
    // Postgres unique_violation: user already claimed this quest today.
    if (error.code === '23505') return { alreadyClaimed: true, xpAwarded: 0 }
    throw error
  }
  return { alreadyClaimed: false, xpAwarded: xp }
}
