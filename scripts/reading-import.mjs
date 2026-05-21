#!/usr/bin/env node
/**
 * reading-import.mjs
 * Imports reading courses from _reading-bundle.json directly into Supabase.
 * Mirrors exactly what AdminCourseList.jsx handleBulkImport / importOneCourse does.
 *
 * Usage:
 *   node scripts/reading-import.mjs                   # import all 20 courses
 *   node scripts/reading-import.mjs --dry-run         # list what would be imported
 *   SUPABASE_EMAIL=... SUPABASE_PASSWORD=... node ... # sign-in first (optional, uses service-key fallback)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL       = process.env.SUPABASE_EMAIL    || 'zyfjeff@gmail.com'
const PASSWORD    = process.env.SUPABASE_PASSWORD || 'xumei520'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const BUNDLE_PATH = path.join(ROOT, 'course-data', 'reading', '_reading-bundle.json')

// ── Supabase client ───────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Sign in ───────────────────────────────────────────────────────────────────
async function signIn() {
  console.log(`Signing in as ${EMAIL}…`)
  const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (error) throw new Error(`Auth failed: ${error.message}`)
  console.log('✓ Signed in')
}

// ── Import helpers (mirrors admin.js) ─────────────────────────────────────────
async function upsertCourse(data) {
  const { data: row, error } = await supabase.from('courses').upsert(data, { onConflict: 'id' }).select().single()
  if (error) throw new Error(`upsertCourse(${data.id}): ${error.message}`)
  return row
}

async function upsertLesson(data) {
  const { data: row, error } = await supabase.from('lessons').upsert(data, { onConflict: 'id' }).select().single()
  if (error) throw new Error(`upsertLesson(${data.id}): ${error.message}`)
  return row
}

async function listSegments(lessonId) {
  const { data, error } = await supabase.from('lesson_segments').select('id').eq('lesson_id', lessonId)
  if (error) throw new Error(`listSegments(${lessonId}): ${error.message}`)
  return data || []
}

async function deleteSegment(id) {
  const { error } = await supabase.from('lesson_segments').delete().eq('id', id)
  if (error) throw new Error(`deleteSegment(${id}): ${error.message}`)
}

async function insertSegment(data) {
  const { id: _drop, ...rest } = data
  const { error } = await supabase.from('lesson_segments').insert({ ...rest, distractors: Array.isArray(data.distractors) ? data.distractors : [] })
  if (error) throw new Error(`insertSegment: ${error.message}`)
}

async function listQuestions(lessonId) {
  const { data, error } = await supabase.from('questions').select('id').eq('lesson_id', lessonId)
  if (error) throw new Error(`listQuestions(${lessonId}): ${error.message}`)
  return data || []
}

async function deleteQuestion(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw new Error(`deleteQuestion(${id}): ${error.message}`)
}

async function insertQuestion(data) {
  const { id: _drop, ...rest } = data
  const { error } = await supabase.from('questions').insert(rest)
  if (error) throw new Error(`insertQuestion: ${error.message}`)
}

async function importOneCourse(payload) {
  const courseId = payload.course.id
  const lessonId = payload.lesson?.id || `${courseId}/01`

  // 1. Course
  await upsertCourse({
    ...payload.course,
    id: courseId,
    kind: payload.course.kind || 'reading',
    is_active: payload.course.is_active !== false,
  })

  // 2. Lesson
  if (payload.lesson) {
    await upsertLesson({
      ...payload.lesson,
      id: lessonId,
      course_id: courseId,
      step_index: payload.lesson.step_index ?? 0,
      kind: payload.lesson.kind || 'reading_passage',
      highlight_words: Array.isArray(payload.lesson.highlight_words) ? payload.lesson.highlight_words : [],
    })
  }

  // 3. Segments — delete existing then insert fresh
  const oldSegs = await listSegments(lessonId)
  for (const s of oldSegs) await deleteSegment(s.id)
  for (let i = 0; i < (payload.segments || []).length; i++) {
    await insertSegment({ ...payload.segments[i], lesson_id: lessonId, sort_order: i })
  }

  // 4. Question
  const oldQs = await listQuestions(lessonId)
  for (const q of oldQs) await deleteQuestion(q.id)
  if (payload.question) {
    await insertQuestion({ ...payload.question, lesson_id: lessonId, sort_order: 0 })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'))
  console.log(`\n=== Reading Import ${DRY_RUN ? '(DRY RUN) ' : ''}===`)
  console.log(`Found ${bundle.length} courses in ${path.relative(ROOT, BUNDLE_PATH)}\n`)

  if (DRY_RUN) {
    bundle.forEach((p, i) => {
      console.log(`  [${i + 1}] ${p.course.id} | diff=${p.course.difficulty} | segs=${p.segments?.length}`)
    })
    return
  }

  await signIn()

  let ok = 0, fail = 0
  for (let i = 0; i < bundle.length; i++) {
    const p = bundle[i]
    const id = p?.course?.id || `(item ${i})`
    try {
      process.stdout.write(`[${i + 1}/${bundle.length}] ${id}… `)
      await importOneCourse(p)
      console.log(`OK (${p.segments?.length || 0} segs)`)
      ok++
    } catch (err) {
      console.log(`FAIL — ${err.message}`)
      fail++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`OK: ${ok}, Failed: ${fail}`)
  if (fail === 0) {
    console.log('\nNext step: open the app to verify reading courses appear in the course list.')
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
