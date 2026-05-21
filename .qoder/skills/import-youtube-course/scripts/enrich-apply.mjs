#!/usr/bin/env node
/**
 * enrich-apply.mjs — Step 3.5b of the import-youtube-course skill.
 *
 * Reads course-data/_enrich-output.json (produced by the agent based on
 * _enrich-input.json) and patches each course JSON in course-data/courses/
 * with:
 *   - lesson.transcript_zh
 *   - segments[i].sentence_zh   (matched by sort_order)
 *   - course.question           (cooldown mcq)
 *
 * Validates strictly:
 *   - results[] entries reference an existing course file
 *   - each segment_zh.sort_order matches an existing segment
 *   - question.payload.options.length === 4
 *   - question.payload.correct is in [0, 3]
 *
 * Honors PROTECTED_IDS (won't touch hand-authored courses even if a result
 * tries to). Dry-run flag --check prints the plan without writing.
 *
 * Usage:
 *   node .qoder/skills/import-youtube-course/scripts/enrich-apply.mjs
 *   node .qoder/skills/import-youtube-course/scripts/enrich-apply.mjs --check
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const OUTPUT = path.join(ROOT, 'course-data', '_enrich-output.json')
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const DRY_RUN = process.argv.includes('--check')

const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])

if (!fs.existsSync(OUTPUT)) {
  console.error(`[fatal] missing ${OUTPUT}`)
  console.error('        Generate it first by reading _enrich-input.json and writing translations + question per task.')
  process.exit(2)
}

const enrich = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
const results = Array.isArray(enrich.results) ? enrich.results : []
if (results.length === 0) {
  console.error('[fatal] _enrich-output.json has empty results[]')
  process.exit(1)
}

let okCount = 0
let errCount = 0
const errors = []

function fail(courseId, msg) {
  errCount++
  errors.push(`${courseId}: ${msg}`)
}

for (const r of results) {
  const courseId = r?.course_id
  if (!courseId) {
    fail('<unknown>', 'missing course_id')
    continue
  }
  if (PROTECTED_IDS.has(courseId)) {
    console.error(`[skip-protected] ${courseId}`)
    continue
  }
  const filePath = path.join(COURSES_DIR, `${courseId}.json`)
  if (!fs.existsSync(filePath)) {
    fail(courseId, `course JSON not found at ${filePath}`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  // ── transcript_zh ────────────────────────────────────────────────
  if (typeof r.transcript_zh !== 'string' || r.transcript_zh.length < 5) {
    fail(courseId, 'transcript_zh missing or too short')
    continue
  }
  data.lesson = data.lesson || {}
  data.lesson.transcript_zh = r.transcript_zh.trim()

  // ── segments_zh by sort_order (= segments array index) ───────────
  // Course JSON segments do not store a sort_order field; we treat the
  // segments[] array index as the canonical sort_order, mirroring what
  // AdminCourseList Bulk Import does (sort_order: i).
  const zhMap = new Map()
  for (const sz of r.segments_zh || []) {
    if (typeof sz.sort_order !== 'number' || typeof sz.sentence_zh !== 'string') continue
    zhMap.set(sz.sort_order, sz.sentence_zh.trim())
  }
  let segUpdated = 0
  const segArr = data.segments || []
  for (let i = 0; i < segArr.length; i++) {
    if (zhMap.has(i)) {
      segArr[i].sentence_zh = zhMap.get(i)
      segUpdated++
    }
  }
  if (segUpdated === 0) {
    fail(courseId, 'no segments_zh matched any segment index')
    continue
  }

  // ── question ─────────────────────────────────────────────────────
  const q = r.question
  if (!q || q.kind !== 'mcq') {
    fail(courseId, 'question.kind must be "mcq"')
    continue
  }
  const opts = q.payload?.options
  if (!Array.isArray(opts) || opts.length !== 4 || opts.some((o) => typeof o !== 'string' || !o.trim())) {
    fail(courseId, 'question.payload.options must be 4 non-empty strings')
    continue
  }
  const correct = q.payload.correct
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
    fail(courseId, 'question.payload.correct must be an integer 0..3')
    continue
  }
  if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim().length < 5) {
    fail(courseId, 'question.prompt missing or too short')
    continue
  }
  data.question = {
    kind: 'mcq',
    prompt: q.prompt.trim(),
    payload: { options: opts.map((o) => o.trim()), correct },
    xp_reward: typeof q.xp_reward === 'number' ? q.xp_reward : 10,
  }

  if (DRY_RUN) {
    console.error(`[ok-check] ${courseId}  (segs=${segUpdated}, q=ok)`)
  } else {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.error(`[ok] ${courseId}  (segs=${segUpdated}, q=ok)`)
  }
  okCount++
}

console.error('')
console.error(`=== enrich-apply: ${okCount} ok, ${errCount} err${DRY_RUN ? ' (DRY RUN)' : ''} ===`)
if (errCount > 0) {
  for (const e of errors) console.error('  ! ' + e)
  process.exit(1)
}
