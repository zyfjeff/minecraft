#!/usr/bin/env node
/**
 * vocab-enrich-apply.mjs
 *
 * Reads course-data/_vocab-enrich-output.json (produced by the agent) and:
 *   1. Validates vocab entry structure
 *   2. Writes course JSON files to course-data/courses/vocab-<slug>.json
 *   3. Writes SQL to course-data/_vocab-skill-entries.sql
 *   4. Updates course-data/courses/_vocab-bundle.json
 *
 * Usage:
 *   node scripts/vocab-enrich-apply.mjs --check   # dry-run, validate only
 *   node scripts/vocab-enrich-apply.mjs           # apply and write
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inferVocabThumbnail } from '../src/lib/courseThumbnails.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const OUTPUT_PATH = path.join(ROOT, 'course-data', '_vocab-enrich-output.json')
const SQL_PATH = path.join(ROOT, 'course-data', '_vocab-skill-entries.sql')
const BUNDLE_PATH = path.join(ROOT, 'course-data', 'courses', '_vocab-bundle.json')

const dryRun = process.argv.includes('--check')

if (!fs.existsSync(OUTPUT_PATH)) {
  console.error(`Output file not found: ${OUTPUT_PATH}`)
  console.error('The agent must produce this file first.')
  process.exit(1)
}

const output = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))

if (!output.results || !Array.isArray(output.results)) {
  console.error('Invalid output: root must have "results" array.')
  process.exit(1)
}

// =============================================================================
// Validation
// =============================================================================
const VALID_POS = new Set(['noun', 'verb', 'adj', 'adv'])
const VALID_ICONS = new Set(['mob', 'sword', 'blocks', 'enchant'])

function validateWord(w, idx, courseSlug) {
  const errors = []
  const prefix = `${courseSlug}.words[${idx}]`
  if (!w.id || typeof w.id !== 'string') errors.push(`${prefix}: missing id`)
  if (!w.word || typeof w.word !== 'string') errors.push(`${prefix}: missing word`)
  if (!VALID_POS.has(w.pos)) errors.push(`${prefix}: invalid pos "${w.pos}"`)
  if (!w.definition_en || w.definition_en.length < 5) errors.push(`${prefix}: definition_en too short`)
  if (!w.definition_zh || w.definition_zh.length < 1) errors.push(`${prefix}: missing definition_zh`)
  if (!w.example_en || w.example_en.length < 10) errors.push(`${prefix}: example_en too short`)
  if (!w.example_zh || w.example_zh.length < 3) errors.push(`${prefix}: missing example_zh`)
  if (!VALID_ICONS.has(w.pixel_icon)) errors.push(`${prefix}: invalid pixel_icon "${w.pixel_icon}"`)
  if (!Array.isArray(w.synonyms) || w.synonyms.length < 2) errors.push(`${prefix}: need at least 2 synonyms`)
  if (!w.minecraft_role || w.minecraft_role.length < 10) errors.push(`${prefix}: minecraft_role too short`)
  if (!w.minecraft_obtain || w.minecraft_obtain.length < 10) errors.push(`${prefix}: minecraft_obtain too short`)
  return errors
}

function validateCourse(course) {
  const errors = []
  if (!course.course_slug) errors.push('missing course_slug')
  if (!course.course_title) errors.push('missing course_title')
  if (!course.description || course.description.length < 10) errors.push('description too short')
  if (!course.difficulty || course.difficulty < 1 || course.difficulty > 3) {
    errors.push(`difficulty must be 1-3 (got ${course.difficulty})`)
  }
  if (!Array.isArray(course.words) || course.words.length < 4) {
    errors.push(`need at least 4 words (got ${course.words?.length || 0})`)
  } else {
    for (let i = 0; i < course.words.length; i++) {
      errors.push(...validateWord(course.words[i], i, course.course_slug))
    }
  }
  return errors
}

// =============================================================================
// Process
// =============================================================================
console.log(`\n=== Vocab Enrich Apply ${dryRun ? '(DRY RUN)' : ''} ===`)
console.log(`Processing ${output.results.length} course(s)...\n`)

let okCount = 0
let failCount = 0
const allErrors = []
const allCourseJsons = [] // for bundle
let sql = `-- =============================================================================
-- Vocabulary entries from import-youtube-course skill
-- Generated at: ${new Date().toISOString()}
-- Uses INSERT ... ON CONFLICT DO UPDATE for idempotency
-- =============================================================================

`

for (const course of output.results) {
  const errors = validateCourse(course)
  if (errors.length > 0) {
    console.error(`[FAIL] ${course.course_slug || 'unknown'}:`)
    for (const e of errors) console.error(`  - ${e}`)
    allErrors.push(...errors)
    failCount++
    continue
  }

  if (dryRun) {
    console.log(`[OK] vocab-${course.course_slug} — ${course.words.length} words validated`)
    okCount++
    continue
  }

  // ── Generate SQL for vocab entries ──────────────────────────────────────────
  for (const v of course.words) {
    const esc = (s) => (s || '').replace(/'/g, "''")
    const arrSQL = (arr) => {
      if (!arr || arr.length === 0) return "'{}'"
      return `ARRAY[${arr.map(s => `'${esc(s)}'`).join(', ')}]`
    }
    sql += `INSERT INTO public.vocab (id, word, pos, definition_en, definition_zh, example_en, example_zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
VALUES (
  '${esc(v.id)}', '${esc(v.word)}', '${esc(v.pos)}',
  '${esc(v.definition_en)}', '${esc(v.definition_zh)}',
  '${esc(v.example_en)}', '${esc(v.example_zh)}',
  '${esc(v.pixel_icon)}', ${arrSQL(v.synonyms)},
  '${esc(v.minecraft_role)}', '${esc(v.minecraft_obtain)}'
)
ON CONFLICT (id) DO UPDATE SET
  definition_en = EXCLUDED.definition_en, definition_zh = EXCLUDED.definition_zh,
  example_en = EXCLUDED.example_en, example_zh = EXCLUDED.example_zh,
  pixel_icon = EXCLUDED.pixel_icon, synonyms = EXCLUDED.synonyms,
  minecraft_role = EXCLUDED.minecraft_role, minecraft_obtain = EXCLUDED.minecraft_obtain;

`
  }

  // ── Generate course JSON ───────────────────────────────────────────────────
  const courseId = `vocab-${course.course_slug}`
  const sortBase = 200 + okCount
  const courseJson = {
    course: {
      id: courseId,
      kind: 'vocabulary',
      title: course.course_title,
      description: course.description,
      difficulty: course.difficulty,
      est_minutes: Math.max(8, course.words.length * 1.5),
      xp_reward: 30,
      unlock_level: 1,
      thumbnail_key: inferVocabThumbnail(courseId + ' ' + (course.course_title || '') + ' ' + (course.description || '')),
      source_label: 'CraftWords Vocabulary',
      source_url: '',
      source_license: 'original',
      sort_order: sortBase,
      is_active: true,
    },
    lesson: {
      step_index: 0,
      kind: 'vocab_drill',
      title: course.course_title,
      highlight_words: course.words.map(w => w.id),
      xp_reward: 30,
    },
    segments: [],
  }

  // Write course JSON
  const coursePath = path.join(COURSES_DIR, `${courseId}.json`)
  fs.writeFileSync(coursePath, JSON.stringify(courseJson, null, 2))
  console.log(`[OK] ${courseId} — ${course.words.length} words → ${coursePath}`)

  allCourseJsons.push(courseJson)
  okCount++
}

// ── Write SQL ────────────────────────────────────────────────────────────────
if (!dryRun && okCount > 0) {
  fs.writeFileSync(SQL_PATH, sql)
  console.log(`\n[sql] Written: ${SQL_PATH}`)

  // ── Write/update vocab bundle ──────────────────────────────────────────────
  let existingBundle = []
  if (fs.existsSync(BUNDLE_PATH)) {
    existingBundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'))
  }

  // Merge: replace existing courses with same id, add new ones
  const bundleMap = new Map(existingBundle.map(c => [c.course.id, c]))
  for (const cj of allCourseJsons) {
    bundleMap.set(cj.course.id, cj)
  }
  const finalBundle = [...bundleMap.values()]
  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(finalBundle, null, 2))
  console.log(`[bundle] Updated: ${BUNDLE_PATH} (${finalBundle.length} vocab courses)`)
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n=== Summary ===`)
console.log(`OK: ${okCount}, Failed: ${failCount}`)
if (allErrors.length > 0) {
  console.log(`Total errors: ${allErrors.length}`)
  if (dryRun) {
    console.log(`\nFix errors in _vocab-enrich-output.json and re-run.`)
  }
}
if (!dryRun && okCount > 0) {
  console.log(`\nNext steps:`)
  console.log(`  1. Execute SQL: ${SQL_PATH}`)
  console.log(`  2. Bundle: node scripts/bundle-unified.mjs --include-vocab`)
  console.log(`  3. Import: Admin Bulk Import`)
}
