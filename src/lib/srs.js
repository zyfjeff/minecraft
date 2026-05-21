// Spaced Repetition (SRS) — local-first MVP.
//
// Why localStorage instead of Supabase: full SRS would require a new
// `user_vocab_progress` table + RLS + indexes. To ship the learner-facing
// review loop quickly without a migration, we persist per-user × per-word
// review state in localStorage. State is keyed by `srs:v1:<userId>`.
//
// Trade-offs:
//   * Single-device only — review state does not roam between browsers.
//     Acceptable for the MVP since the same user typically practices on
//     one primary device. A follow-up migration can copy state into a
//     Supabase table without changing the public API surface here.
//   * Storage cap (~5MB) is plenty: per-word state is ~80 bytes; even 5k
//     words fits in 400KB.
//
// Algorithm: simplified SM-2.
//   ease defaults to 2.5; clamped to [1.3, 2.8].
//   intervalDays starts at 1.
//   ratings: 'again' | 'good' | 'easy'
//     - again: interval = 10/1440 (10 min), repetitions = 0, ease -= 0.2
//     - good:  if first repetition → 1d; else interval *= ease;       ease unchanged
//     - easy:  if first repetition → 4d; else interval *= ease * 1.3; ease += 0.15

const STORAGE_PREFIX = 'srs:v1:'
const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const MAX_EASE = 2.8

function key(userId) {
  return STORAGE_PREFIX + (userId || 'anonymous')
}

function safeRead(userId) {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function safeWrite(userId, state) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(state))
  } catch {
    // Quota exceeded or storage disabled — degrade silently.
  }
}

function now() { return Date.now() }

// Public: read raw map { word: state }.
export function loadSrsState(userId) {
  return safeRead(userId)
}

// Public: clear all SRS state for the user (debug helper).
export function clearSrsState(userId) {
  try { localStorage.removeItem(key(userId)) } catch { /* ignore */ }
}

// Build a default state for a freshly-introduced word.
function defaultState() {
  return {
    ease: DEFAULT_EASE,
    intervalDays: 0,        // not yet scheduled
    repetitions: 0,
    dueAt: now(),           // immediately due → first review
    lastReviewed: null,
  }
}

// Compute the next state from current state + a rating.
export function computeNextState(state, rating) {
  const cur = state || defaultState()
  let { ease, intervalDays, repetitions } = cur
  let nextDueOffsetMs

  if (rating === 'again') {
    repetitions = 0
    ease = Math.max(MIN_EASE, ease - 0.2)
    intervalDays = 0
    nextDueOffsetMs = 10 * 60 * 1000 // 10 minutes
  } else if (rating === 'easy') {
    if (repetitions === 0) intervalDays = 4
    else intervalDays = Math.max(1, Math.round(intervalDays * ease * 1.3))
    ease = Math.min(MAX_EASE, ease + 0.15)
    repetitions += 1
    nextDueOffsetMs = intervalDays * 86400 * 1000
  } else {
    // 'good' (default)
    if (repetitions === 0) intervalDays = 1
    else if (repetitions === 1) intervalDays = Math.max(2, Math.round(intervalDays * ease))
    else intervalDays = Math.max(1, Math.round(intervalDays * ease))
    repetitions += 1
    nextDueOffsetMs = intervalDays * 86400 * 1000
  }

  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: now() + nextDueOffsetMs,
    lastReviewed: now(),
  }
}

// Public: record a review for a word. Word is lowercased.
export function recordReview(userId, word, rating) {
  if (!word) return
  const w = String(word).toLowerCase()
  const state = safeRead(userId)
  state[w] = computeNextState(state[w], rating)
  safeWrite(userId, state)
  return state[w]
}

// Public: ensure brand-new words from learned set get a baseline state.
// Called when the user opens review mode so newly-learned words can enter
// the queue without an explicit initialization step.
export function ensureSeedForLearnedWords(userId, learnedWords) {
  const state = safeRead(userId)
  let dirty = false
  for (const raw of learnedWords || []) {
    const w = String(raw || '').toLowerCase()
    if (!w) continue
    if (!state[w]) {
      state[w] = defaultState()
      dirty = true
    }
  }
  if (dirty) safeWrite(userId, state)
  return state
}

// Public: list words that are due for review (dueAt <= now).
// Optionally restrict to a set of currently-learned words so deleted/forgotten
// course words don't keep showing up.
export function listDueWords(userId, learnedWords, { limit = 20 } = {}) {
  const state = ensureSeedForLearnedWords(userId, learnedWords)
  const learnedSet = learnedWords instanceof Set
    ? learnedWords
    : new Set(Array.from(learnedWords || []).map((w) => String(w).toLowerCase()))
  const tNow = now()
  const due = []
  for (const [word, st] of Object.entries(state)) {
    if (!learnedSet.has(word)) continue
    if (!st || st.dueAt <= tNow) due.push({ word, state: st || defaultState() })
  }
  // Soonest-overdue first; new (dueAt absent) sorts to top via 0.
  due.sort((a, b) => (a.state?.dueAt || 0) - (b.state?.dueAt || 0))
  if (limit && due.length > limit) return due.slice(0, limit)
  return due
}

// Public: count of due words right now (cheap, used by Home strip).
export function countDueWords(userId, learnedWords) {
  if (!userId || !learnedWords || learnedWords.size === 0) return 0
  const state = safeRead(userId)
  const learnedSet = learnedWords instanceof Set ? learnedWords : new Set(Array.from(learnedWords).map((w) => String(w).toLowerCase()))
  const tNow = now()
  let count = 0
  for (const w of learnedSet) {
    const st = state[w]
    if (!st || st.dueAt <= tNow) count += 1
  }
  return count
}
