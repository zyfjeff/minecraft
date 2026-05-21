import { supabase } from './supabase'

// Returns the Date (at 00:00 UTC) representing the Monday of the ISO week
// containing `date`. ISO week: Monday is the first day of the week.
export function getWeekStartUtc(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const dow = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const offsetToMonday = (dow + 6) % 7 // Mon=>0, Tue=>1, ..., Sun=>6
  d.setUTCDate(d.getUTCDate() - offsetToMonday)
  return d
}

// YYYY-MM-DD UTC string for a Date.
function utcDateStr(d) {
  return d.toISOString().slice(0, 10)
}

// Distinct completed_on dates for the current ISO week (Mon..Sun, UTC).
export async function listThisWeekCompletedDates(userId) {
  if (!userId) return []
  const start = getWeekStartUtc()
  const { data, error } = await supabase
    .from('quest_completions')
    .select('completed_on')
    .eq('user_id', userId)
    .gte('completed_on', utcDateStr(start))
  if (error) throw error
  return [...new Set((data || []).map((r) => r.completed_on))]
}

// Convert a date list into 7 booleans (Mon..Sun) representing whether the
// user completed at least one quest on that weekday of the current ISO week.
export function computeWeekDots(dates) {
  const start = getWeekStartUtc()
  const set = new Set(dates || [])
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    return set.has(utcDateStr(d))
  })
}
