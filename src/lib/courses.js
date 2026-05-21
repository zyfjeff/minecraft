import { supabase } from './supabase'

// =============================================================================
// Catalog reads (publicly readable for authenticated users via RLS)
// =============================================================================

// Active courses, ordered for the CourseList grid.
//
// Reads from `courses_card_view` (see supabase-migration/18_courses_card_view.sql)
// which projects each course row plus a server-aggregated `lessons_count` and
// the first lesson's `yt_video_id`. This avoids fetching the full lessons[]
// subtree for every course just to compute those two fields client-side.
//
// Falls back to the legacy nested-select query when the view is missing (e.g.,
// a fresh database whose 18_*.sql migration hasn't been applied yet) so old
// deployments keep working until the SQL is applied.
export async function listCourses() {
  const { data, error } = await supabase
    .from('courses_card_view')
    .select(
      'id, kind, title, description, difficulty, est_minutes, xp_reward, ' +
      'unlock_level, thumbnail_key, source_label, source_url, source_license, ' +
      'sort_order, lessons_count, yt_video_id'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (!error) {
    return (data || []).map((row) => ({
      ...row,
      lessons_count: Number(row.lessons_count) || 0,
      yt_video_id: row.yt_video_id || null,
    }))
  }

  // Fallback path — view is unavailable. Run the legacy nested select so the
  // app degrades gracefully on older databases. Logged once so ops know to
  // apply the migration.
  // eslint-disable-next-line no-console
  console.warn('[courses] courses_card_view unavailable, falling back to nested select', error)
  const fb = await supabase
    .from('courses')
    .select(
      'id, kind, title, description, difficulty, est_minutes, xp_reward, ' +
      'unlock_level, thumbnail_key, source_label, source_url, source_license, ' +
      'sort_order, lessons(id, step_index, yt_video_id)'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (fb.error) throw fb.error
  return (fb.data || []).map((row) => {
    const lessons = Array.isArray(row.lessons) ? row.lessons : []
    const firstLesson = lessons
      .slice()
      .sort((a, b) => (a.step_index ?? 0) - (b.step_index ?? 0))[0]
    return {
      ...row,
      lessons_count: lessons.length,
      yt_video_id: firstLesson?.yt_video_id || null,
    }
  })
}

// Lessons for a single course, ordered by step_index.
export async function listLessonsForCourse(courseId) {
  if (!courseId) return []
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, course_id, step_index, kind, title, yt_video_id, yt_start_sec, ' +
      'yt_end_sec, passage_md, transcript_en, transcript_zh, highlight_words, ' +
      'xp_reward'
    )
    .eq('course_id', courseId)
    .order('step_index', { ascending: true })
  if (error) throw error
  return data || []
}

// Pre-cut segments for a video_segment lesson, ordered by sort_order. Returns
// an empty array when the lesson has no rows in lesson_segments — callers
// should then fall back to the legacy front-end split (buildTranscriptLines).
export async function fetchLessonSegments(lessonId) {
  if (!lessonId) return []
  const { data, error } = await supabase
    .from('lesson_segments')
    .select(
      'id, lesson_id, sort_order, start_sec, end_sec, sentence_en, sentence_zh, ' +
      'blank_word, distractors, qtype, quiz_payload'
    )
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => ({
    ...row,
    start_sec: Number(row.start_sec) || 0,
    end_sec: Number(row.end_sec) || 0,
    distractors: Array.isArray(row.distractors) ? row.distractors : [],
  }))
}

// Quiz questions for a single lesson.
export async function listQuestionsForLesson(lessonId) {
  if (!lessonId) return []
  const { data, error } = await supabase
    .from('questions')
    .select('id, lesson_id, kind, prompt, payload, xp_reward, sort_order')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

// Full vocab dictionary. Small (<2000 rows expected) so we cache the whole
// table in memory and expose a `Record<word, row>` for O(1) popover lookup.
export async function listVocab() {
  const { data, error } = await supabase
    .from('vocab')
    .select('id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain')
  if (error) throw error
  return data || []
}

export function buildVocabMap(rows) {
  const map = {}
  for (const row of rows || []) {
    if (!row?.word) continue
    map[row.word.toLowerCase()] = row
  }
  return map
}

// =============================================================================
// Per-user progress (RLS: auth.uid() = user_id)
// =============================================================================

export async function listUserCourseProgress(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('user_course_progress')
    .select('user_id, course_id, completed_lesson_ids, completed_question_ids, last_accessed_at, updated_at')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export function buildProgressMap(rows) {
  const map = {}
  for (const row of rows || []) {
    if (!row?.course_id) continue
    map[row.course_id] = row
  }
  return map
}

// Count unique vocabulary words the user has learned (across all completed
// lessons' highlight_words). Used by Achievements + VocabBook.
export async function fetchLearnedVocabCount(userId) {
  if (!userId) return 0
  const cached = readVocabCache(userId)
  if (cached) return cached.size
  const set = await loadLearnedVocabSet(userId)
  return set.size
}

// Returns the set of unique vocab words learned by the user.
export async function fetchLearnedVocabWords(userId) {
  if (!userId) return new Set()
  const cached = readVocabCache(userId)
  if (cached) return cached
  return loadLearnedVocabSet(userId)
}

// Invalidate after a lesson completion so the next read refetches fresh data.
// Callers (markLessonComplete et al.) can opt-in; otherwise the 5-minute TTL
// will eventually catch up.
export function invalidateLearnedVocabCache(userId) {
  if (!userId) return
  vocabCacheStore.delete(userId)
}

// ---- Internal: 5-minute TTL cache for the (expensive) join over
// user_course_progress.completed_lesson_ids × lessons.highlight_words. ----
const VOCAB_CACHE_TTL_MS = 5 * 60 * 1000
const vocabCacheStore = new Map() // userId → { set: Set<string>, expiresAt: number }

function readVocabCache(userId) {
  const entry = vocabCacheStore.get(userId)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    vocabCacheStore.delete(userId)
    return null
  }
  return entry.set
}

async function loadLearnedVocabSet(userId) {
  const { data: progress, error: pErr } = await supabase
    .from('user_course_progress')
    .select('completed_lesson_ids')
    .eq('user_id', userId)
  if (pErr) return new Set()
  const allIds = (progress || []).flatMap((r) => r.completed_lesson_ids || [])
  if (allIds.length === 0) {
    const empty = new Set()
    vocabCacheStore.set(userId, { set: empty, expiresAt: Date.now() + VOCAB_CACHE_TTL_MS })
    return empty
  }
  const { data: lessons, error: lErr } = await supabase
    .from('lessons')
    .select('highlight_words')
    .in('id', allIds)
  if (lErr) return new Set()
  const set = new Set(
    (lessons || []).flatMap((l) => (l.highlight_words || []).map((w) => w.toLowerCase())),
  )
  vocabCacheStore.set(userId, { set, expiresAt: Date.now() + VOCAB_CACHE_TTL_MS })
  return set
}

// Append lessonId to completed_lesson_ids for (userId, courseId). Returns
//   { alreadyCompleted: true,  xpAwarded: 0, row } — already in the array
//   { alreadyCompleted: false, xpAwarded: N,  row } — first time, caller bumps profile.xp
//
// We do a read-modify-write rather than a DB-side array_append because we need
// the "first time" signal to award XP exactly once. There is a small race
// window if the user double-taps; acceptable for MVP.
export async function markLessonComplete(userId, courseId, lessonId, xpReward = 0) {
  if (!userId || !courseId || !lessonId) {
    throw new Error('markLessonComplete: missing userId/courseId/lessonId')
  }
  const { data: existing, error: readErr } = await supabase
    .from('user_course_progress')
    .select('completed_lesson_ids, completed_question_ids')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (readErr) throw readErr

  const prevLessons = existing?.completed_lesson_ids || []
  if (prevLessons.includes(lessonId)) {
    return { alreadyCompleted: true, xpAwarded: 0, row: existing }
  }
  const nextLessons = [...prevLessons, lessonId]
  const payload = {
    user_id: userId,
    course_id: courseId,
    completed_lesson_ids: nextLessons,
    completed_question_ids: existing?.completed_question_ids || [],
    last_accessed_at: new Date().toISOString(),
  }
  const { data: upserted, error: upErr } = await supabase
    .from('user_course_progress')
    .upsert(payload, { onConflict: 'user_id,course_id' })
    .select('user_id, course_id, completed_lesson_ids, completed_question_ids, last_accessed_at, updated_at')
    .single()
  if (upErr) throw upErr
  // 完成一课后 highlight_words 可能变化，例如词汇本、Achievements
  // 页面下次进入会读到 stale 计数。主动失效避免这种拼接延迟。
  invalidateLearnedVocabCache(userId)
  return { alreadyCompleted: false, xpAwarded: Number(xpReward) || 0, row: upserted }
}

// Same shape as markLessonComplete but for questions. Caller should pass
// xpReward only when the answer is correct; an incorrect answer can still
// be recorded by passing xpReward=0.
export async function recordQuestionAnswer(userId, courseId, questionId, xpReward = 0) {
  if (!userId || !courseId || !questionId) {
    throw new Error('recordQuestionAnswer: missing userId/courseId/questionId')
  }
  const qid = Number(questionId)
  const { data: existing, error: readErr } = await supabase
    .from('user_course_progress')
    .select('completed_lesson_ids, completed_question_ids')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (readErr) throw readErr

  const prevQs = existing?.completed_question_ids || []
  if (prevQs.includes(qid)) {
    return { alreadyAnswered: true, xpAwarded: 0, row: existing }
  }
  const nextQs = [...prevQs, qid]
  const payload = {
    user_id: userId,
    course_id: courseId,
    completed_lesson_ids: existing?.completed_lesson_ids || [],
    completed_question_ids: nextQs,
    last_accessed_at: new Date().toISOString(),
  }
  const { data: upserted, error: upErr } = await supabase
    .from('user_course_progress')
    .upsert(payload, { onConflict: 'user_id,course_id' })
    .select('user_id, course_id, completed_lesson_ids, completed_question_ids, last_accessed_at, updated_at')
    .single()
  if (upErr) throw upErr
  return { alreadyAnswered: false, xpAwarded: Number(xpReward) || 0, row: upserted }
}

// Append-only log entry for one segment quiz attempt. Records who/what/right-or-wrong,
// the quiz type, and how many hearts the learner has left. Returns the inserted row,
// or null + a console warning when the insert fails so the UI flow is never blocked.
export async function saveSegmentAttempt({
  userId,
  segmentId,
  choice,
  isCorrect,
  heartsLeftAfter,
  qtype,
}) {
  if (!userId || !segmentId) return null
  const payload = {
    user_id: userId,
    segment_id: Number(segmentId),
    choice: String(choice ?? ''),
    is_correct: !!isCorrect,
    hearts_left_after: Math.max(0, Number(heartsLeftAfter) || 0),
    qtype: qtype || 'cloze',
  }
  const { data, error } = await supabase
    .from('user_segment_attempts')
    .insert(payload)
    .select('id, user_id, segment_id, choice, is_correct, hearts_left_after, qtype, attempted_at')
    .single()
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[courses] saveSegmentAttempt failed', error)
    return null
  }
  return data
}

// Save a post-lesson listening report (best-effort, non-blocking).
export async function saveLessonReport({
  userId,
  lessonId,
  totalSegments,
  correctCount,
  perQtypeScores,
  weakAreas,
  heartsRemaining,
  timeSpentSec,
}) {
  if (!userId || !lessonId) return null
  const payload = {
    user_id: userId,
    lesson_id: lessonId,
    total_segments: Number(totalSegments) || 0,
    correct_count: Number(correctCount) || 0,
    per_qtype_scores: perQtypeScores || {},
    weak_areas: Array.isArray(weakAreas) ? weakAreas : [],
    hearts_remaining: Math.max(0, Number(heartsRemaining) || 0),
    time_spent_sec: Math.max(0, Number(timeSpentSec) || 0),
  }
  const { data, error } = await supabase
    .from('user_lesson_reports')
    .insert(payload)
    .select('id, user_id, lesson_id, total_segments, correct_count, per_qtype_scores, weak_areas, hearts_remaining, time_spent_sec, completed_at')
    .single()
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[courses] saveLessonReport failed', error)
    return null
  }
  return data
}

// =============================================================================
// Helpers shared by UI
// =============================================================================

// Compute a 0..100 progress percent for a single course. Accepts either a
// lesson list (use .length as denominator) or a precomputed `lessons_count`
// number coming from the listCourses aggregate. Returns 0 when there are no
// lessons (so a course with no published content shows an empty bar).
export function computeCoursePercent(lessonsOrCount, progressRow) {
  const total = typeof lessonsOrCount === 'number'
    ? lessonsOrCount
    : (lessonsOrCount?.length ?? 0)
  if (!total) return 0
  const done = (progressRow?.completed_lesson_ids || []).length
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}
