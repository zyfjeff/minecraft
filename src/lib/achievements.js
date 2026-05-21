import { supabase } from './supabase'

// Read the achievements catalog (publicly readable for authed users).
export async function listAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('id, name, description, icon, color_token, condition_type, threshold, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

// Read the current user's unlocked achievement ids (with unlock timestamp,
// so callers can sort "Recent Achievements" by unlocked_at desc if needed).
export async function listUserUnlocks(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Compute the set of achievements that should be unlocked for `userId` given
// their current profile + quest completion count, then insert any newly
// satisfied ones. Idempotent: if an achievement is already unlocked we skip
// it; if a parallel claim races us the (user_id, achievement_id) primary
// key catches the duplicate (23505) and we treat it as success.
//
// `condition_type` values:
//   - 'quest_count'  : total lifetime completions across all quests
//   - 'streak'       : profile.streak (consecutive days)
//   - 'level'        : profile.level
//   - 'vocab_count'  : unique vocab words across all completed lessons
//
// Returns the up-to-date unlocks list (after possible insert) so callers
// can replace local state in one shot.
export async function evaluateAndUnlock(userId) {
  if (!userId) return []

  const [catalogRes, profileRes, countRes, unlockedRes, progressRes] = await Promise.all([
    supabase
      .from('achievements')
      .select('id, condition_type, threshold')
      .eq('active', true),
    supabase
      .from('profiles')
      .select('level, streak')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('quest_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId),
    supabase
      .from('user_course_progress')
      .select('completed_lesson_ids')
      .eq('user_id', userId),
  ])

  if (catalogRes.error) throw catalogRes.error
  if (profileRes.error) throw profileRes.error
  if (countRes.error) throw countRes.error
  if (unlockedRes.error) throw unlockedRes.error
  if (progressRes.error) throw progressRes.error

  const catalog = catalogRes.data || []
  const level = profileRes.data?.level ?? 1
  const streak = profileRes.data?.streak ?? 0
  const questCount = countRes.count ?? 0
  const unlocked = unlockedRes.data || []
  const unlockedSet = new Set(unlocked.map((r) => r.achievement_id))

  // Real vocab count: distinct highlight_words across all completed lessons.
  // Collect all completed lesson IDs, then query their highlight_words.
  const allLessonIds = (progressRes.data || [])
    .flatMap((r) => r.completed_lesson_ids || [])
  let vocabCount = 0
  if (allLessonIds.length > 0) {
    const { data: lessonRows, error: lessonErr } = await supabase
      .from('lessons')
      .select('highlight_words')
      .in('id', allLessonIds)
    if (!lessonErr && lessonRows) {
      const uniqueWords = new Set(
        lessonRows.flatMap((l) => l.highlight_words || [])
      )
      vocabCount = uniqueWords.size
    }
  }

  const meets = (a) => {
    switch (a.condition_type) {
      case 'quest_count': return questCount >= a.threshold
      case 'streak':      return streak     >= a.threshold
      case 'level':       return level      >= a.threshold
      case 'vocab_count': return vocabCount >= a.threshold
      default: return false
    }
  }

  const toInsert = catalog
    .filter((a) => !unlockedSet.has(a.id) && meets(a))
    .map((a) => ({ user_id: userId, achievement_id: a.id }))

  if (toInsert.length === 0) return unlocked

  const { error: insErr } = await supabase
    .from('user_achievements')
    .insert(toInsert)
  // 23505 = unique_violation: someone else already unlocked it for this user
  // (e.g. parallel tab). Treat as success and re-read.
  if (insErr && insErr.code !== '23505') throw insErr

  const { data: fresh, error: refErr } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
  if (refErr) throw refErr
  return fresh || []
}
