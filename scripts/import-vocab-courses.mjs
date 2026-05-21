#!/usr/bin/env node
/**
 * import-vocab-courses.mjs
 *
 * Imports vocabulary course structures (courses + lessons) directly into
 * Supabase using the REST API. This handles course and lesson UPSERT only.
 * Vocab word entries must be imported separately via SQL.
 *
 * Usage: node scripts/import-vocab-courses.mjs
 *
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env.local
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Read env vars from .env.local
const envPath = path.join(ROOT, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^(VITE_\w+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
}

async function upsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${table} upsert failed (${res.status}): ${text}`)
  }
}

// Load the vocab bundle
const bundlePath = path.join(ROOT, 'course-data/courses/_vocab-bundle.json')
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))

console.log(`Importing ${bundle.length} vocabulary courses...\n`)

let ok = 0
let fail = 0

for (const item of bundle) {
  const courseId = item.course.id
  try {
    // 1. Upsert course
    await upsert('courses', [{
      id: courseId,
      kind: item.course.kind,
      title: item.course.title,
      description: item.course.description,
      difficulty: item.course.difficulty,
      est_minutes: item.course.est_minutes,
      xp_reward: item.course.xp_reward,
      unlock_level: item.course.unlock_level,
      source_label: item.course.source_label,
      source_url: item.course.source_url || '',
      source_license: item.course.source_license,
      sort_order: item.course.sort_order,
      is_active: item.course.is_active,
    }])

    // 2. Upsert lesson
    const lessonId = `${courseId}-lesson-0`
    await upsert('lessons', [{
      id: lessonId,
      course_id: courseId,
      step_index: item.lesson.step_index,
      kind: item.lesson.kind,
      title: item.lesson.title,
      yt_video_id: item.lesson.yt_video_id,
      yt_start_sec: item.lesson.yt_start_sec,
      yt_end_sec: item.lesson.yt_end_sec,
      passage_md: item.lesson.passage_md,
      transcript_en: item.lesson.transcript_en,
      transcript_zh: item.lesson.transcript_zh,
      highlight_words: item.lesson.highlight_words,
      xp_reward: item.lesson.xp_reward,
    }])

    console.log(`  ✓ ${courseId} (${item.lesson.highlight_words.length} words)`)
    ok++
  } catch (err) {
    console.error(`  ✗ ${courseId}: ${err.message}`)
    fail++
  }
}

console.log(`\n=== Done: ${ok} ok, ${fail} failed ===`)
