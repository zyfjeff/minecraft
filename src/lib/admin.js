// =============================================================================
// Admin CRUD operations for course management.
// These functions rely on the admin RLS policies (supabase-admin-rls.sql)
// which grant full table access to whitelisted admin emails.
// =============================================================================
import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

/** List ALL courses (including inactive), ordered by sort_order. */
export async function listAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, lessons(count)')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map((row) => ({
    ...row,
    lessons_count: Array.isArray(row.lessons) ? (row.lessons[0]?.count ?? 0) : 0,
  }))
}

/** Upsert a course row. `data.id` is required. */
export async function upsertCourse(data) {
  if (!data?.id) throw new Error('upsertCourse: id is required')
  const { data: row, error } = await supabase
    .from('courses')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete a course by id (cascades to lessons, segments, etc.). */
export async function deleteCourse(id) {
  if (!id) throw new Error('deleteCourse: id is required')
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

/** List all lessons for a course, ordered by step_index. */
export async function listLessonsAdmin(courseId) {
  if (!courseId) return []
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('step_index', { ascending: true })
  if (error) throw error
  return data || []
}

/** Upsert a lesson row. `data.id` is required. */
export async function upsertLesson(data) {
  if (!data?.id) throw new Error('upsertLesson: id is required')
  const { data: row, error } = await supabase
    .from('lessons')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete a lesson by id (cascades to segments). */
export async function deleteLesson(id) {
  if (!id) throw new Error('deleteLesson: id is required')
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Lesson Segments
// ---------------------------------------------------------------------------

/** List all segments for a lesson, ordered by sort_order. */
export async function listSegmentsAdmin(lessonId) {
  if (!lessonId) return []
  const { data, error } = await supabase
    .from('lesson_segments')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

/** Upsert a segment. For new segments (no id), omit the id field. */
export async function upsertSegment(data) {
  if (!data?.lesson_id) throw new Error('upsertSegment: lesson_id is required')
  const payload = { ...data }
  // If it has an id, upsert by id; otherwise insert new.
  if (payload.id) {
    const { data: row, error } = await supabase
      .from('lesson_segments')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return row
  }
  // New segment — insert without id (auto-generated)
  delete payload.id
  const { data: row, error } = await supabase
    .from('lesson_segments')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete a segment by id. */
export async function deleteSegment(id) {
  if (!id) throw new Error('deleteSegment: id is required')
  const { error } = await supabase.from('lesson_segments').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Questions (Cooldown MCQ)
// ---------------------------------------------------------------------------

/** List questions for a lesson. */
export async function listQuestionsAdmin(lessonId) {
  if (!lessonId) return []
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

/** Upsert a question. For new (no id), omit id. */
export async function upsertQuestion(data) {
  if (!data?.lesson_id) throw new Error('upsertQuestion: lesson_id is required')
  const payload = { ...data }
  if (payload.id) {
    const { data: row, error } = await supabase
      .from('questions')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return row
  }
  delete payload.id
  const { data: row, error } = await supabase
    .from('questions')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete a question by id. */
export async function deleteQuestion(id) {
  if (!id) throw new Error('deleteQuestion: id is required')
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Achievements (Rewards)
// ---------------------------------------------------------------------------

/** List ALL achievements (including inactive), ordered by sort_order. */
export async function listAllAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

/** Upsert an achievement row. `data.id` is required. */
export async function upsertAchievement(data) {
  if (!data?.id) throw new Error('upsertAchievement: id is required')
  const { data: row, error } = await supabase
    .from('achievements')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete an achievement by id. */
export async function deleteAchievement(id) {
  if (!id) throw new Error('deleteAchievement: id is required')
  const { error } = await supabase.from('achievements').delete().eq('id', id)
  if (error) throw error
}

/** List user_achievements for a specific achievement (who unlocked it). */
export async function listAchievementUnlocks(achievementId) {
  if (!achievementId) return []
  const { data, error } = await supabase
    .from('user_achievements')
    .select('user_id, unlocked_at')
    .eq('achievement_id', achievementId)
    .order('unlocked_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** Revoke (delete) a user's achievement unlock. */
export async function revokeUserAchievement(userId, achievementId) {
  if (!userId || !achievementId) throw new Error('revokeUserAchievement: userId and achievementId required')
  const { error } = await supabase
    .from('user_achievements')
    .delete()
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Quests (Daily Quests)
// ---------------------------------------------------------------------------

/** List ALL quests (including inactive), ordered by sort_order. */
export async function listAllQuestsAdmin() {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

/** Upsert a quest row. `data.id` is required for existing quests. */
export async function upsertQuest(data) {
  if (!data?.id) throw new Error('upsertQuest: id is required')
  const { data: row, error } = await supabase
    .from('quests')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return row
}

/** Delete a quest by id. */
export async function deleteQuest(id) {
  if (!id) throw new Error('deleteQuest: id is required')
  const { error } = await supabase.from('quests').delete().eq('id', id)
  if (error) throw error
}
