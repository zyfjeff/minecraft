#!/usr/bin/env node
/**
 * bundle-unified.mjs
 *
 * Combines Listening + Reading + Vocabulary course bundles into a single
 * JSON array for Admin Bulk Import. Used by the unified import-youtube-course
 * skill to import all 3 course types in one Admin Bulk Import pass.
 *
 * Selection logic:
 *   1. Listening courses: from course-data/_skill-import.json video ids
 *   2. Reading courses: all enriched reading JSONs in course-data/reading/
 *      that match the imported listening course ids
 *   3. Vocabulary courses: from course-data/courses/_vocab-bundle.json
 *      (if --include-vocab flag is set)
 *
 * Usage:
 *   node scripts/bundle-unified.mjs                          # listening + reading
 *   node scripts/bundle-unified.mjs --include-vocab           # all 3 types
 *   node scripts/bundle-unified.mjs --vocab-only vocab-hostile-mobs  # specific vocab course
 *
 * Output:
 *   public/_skill-bundle.json   (dev server serves for browser injection)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const READING_DIR = path.join(ROOT, 'course-data', 'reading')
const IMPORT_PATH = path.join(ROOT, 'course-data', '_skill-import.json')
const OUT_PUBLIC = path.join(ROOT, 'public', '_skill-bundle.json')

const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])

const includeVocab = process.argv.includes('--include-vocab')
const vocabOnlyIdx = process.argv.indexOf('--vocab-only')
const vocabOnlyId = vocabOnlyIdx >= 0 ? process.argv[vocabOnlyIdx + 1] : null

// ─── 1. Listening courses from this import run ────────────────────────
const listening = []
if (fs.existsSync(IMPORT_PATH)) {
  const importPlan = JSON.parse(fs.readFileSync(IMPORT_PATH, 'utf8'))
  const wantedIds = new Set((importPlan.videos || []).map((v) => v.id))

  const allFiles = fs
    .readdirSync(COURSES_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  for (const f of allFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(COURSES_DIR, f), 'utf8'))
    const ytId = data?.lesson?.yt_video_id
    const courseId = data?.course?.id
    if (!ytId || !wantedIds.has(ytId)) continue
    if (PROTECTED_IDS.has(courseId)) {
      console.error(`[skip-protected] ${courseId}`)
      continue
    }
    listening.push(data)
  }
  console.error(`[listening] ${listening.length} course(s) bundled`)
} else {
  console.error('[info] No _skill-import.json found, skipping listening courses')
}

// ─── 2. Reading courses matching imported listening courses ───────────
const reading = []
const listeningIds = new Set(listening.map((c) => c.course.id))
if (fs.existsSync(READING_DIR)) {
  const readingFiles = fs
    .readdirSync(READING_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  for (const f of readingFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(READING_DIR, f), 'utf8'))
    const courseId = data?.course?.id
    // Only include reading courses derived from THIS import's listening courses
    // Reading ID format: reading-<listening-course-id>
    const sourceListeningId = courseId?.replace(/^reading-/, '')
    if (!listeningIds.has(sourceListeningId) && listeningIds.size > 0) continue
    // Skip unenriched scaffolds
    if (!data?.lesson?.passage_md || data.lesson.passage_md.trim().length < 50) {
      console.error(`[skip-unenriched] ${courseId}`)
      continue
    }
    reading.push(data)
  }
  console.error(`[reading] ${reading.length} course(s) bundled`)
}

// ─── 3. Vocabulary courses (optional) ────────────────────────────────
const vocab = []
if (includeVocab || vocabOnlyId) {
  const vocabBundlePath = path.join(COURSES_DIR, '_vocab-bundle.json')
  if (fs.existsSync(vocabBundlePath)) {
    const allVocab = JSON.parse(fs.readFileSync(vocabBundlePath, 'utf8'))
    for (const v of allVocab) {
      if (vocabOnlyId && v.course.id !== vocabOnlyId) continue
      vocab.push(v)
    }
    console.error(`[vocab] ${vocab.length} course(s) bundled`)
  } else {
    console.error('[warn] No _vocab-bundle.json found')
  }
}

// ─── 4. Combine and write ────────────────────────────────────────────
const combined = [...listening, ...reading, ...vocab]

if (combined.length === 0) {
  console.error('[fatal] No courses to bundle.')
  process.exit(1)
}

fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true })
const json = JSON.stringify(combined, null, 2)
fs.writeFileSync(OUT_PUBLIC, json)

console.error(`\n[ok] Unified bundle: ${combined.length} course(s)`)
console.error(`     listening: ${listening.length}`)
console.error(`     reading:   ${reading.length}`)
console.error(`     vocab:     ${vocab.length}`)
console.error(`     output:    ${OUT_PUBLIC}`)
console.error(`     bytes:     ${json.length}`)
