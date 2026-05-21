#!/usr/bin/env node
/**
 * bundle.mjs — Step 4 of the import-youtube-course skill.
 *
 * Concatenates ONLY the courses produced for THIS skill run (not the whole
 * course-data/courses/ directory) into a JSON array suitable for the Admin
 * "Bulk Import" textarea, and copies it to the dev-server-served path.
 *
 * Selection logic:
 *   - Read course-data/_skill-import.json -> videos[].id
 *   - For each id, derive the course id the same way generate-courses-v2.mjs
 *     does (slugified title prefixed with "minecraft-")
 *   - Read course-data/courses/_index.json (last v2 generator run) — this
 *     contains the authoritative id list, including any PROTECTED ones we
 *     should NOT re-import.
 *   - Honor PROTECTED_IDS so we don't overwrite hand-authored courses.
 *
 * Outputs:
 *   course-data/courses/_skill-bundle.json
 *   public/_skill-bundle.json   (dev server serves it for browser injection)
 *
 * Usage:
 *   node .qoder/skills/import-youtube-course/scripts/bundle.mjs \
 *        course-data/_skill-import.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const INPUT = path.resolve(process.cwd(), process.argv[2] || 'course-data/_skill-import.json')
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const OUT_PRIMARY = path.join(COURSES_DIR, '_skill-bundle.json')
const OUT_PUBLIC = path.join(ROOT, 'public', '_skill-bundle.json')

const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])

if (!fs.existsSync(INPUT)) {
  console.error(`[fatal] input not found: ${INPUT}`)
  process.exit(2)
}
const importPlan = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
const wantedIds = new Set((importPlan.videos || []).map((v) => v.id))

// Read the most recent generator index (id list it just wrote)
const indexPath = path.join(COURSES_DIR, '_index.json')
let indexIds = []
if (fs.existsSync(indexPath)) {
  try {
    const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    indexIds = Array.isArray(idx.ids) ? idx.ids : []
  } catch {}
}

// Find course-data/courses/<id>.json files whose payload.lesson.yt_video_id
// matches one of our wanted YouTube ids.
const allFiles = fs
  .readdirSync(COURSES_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

const arr = []
const skipped = []
const matchedFiles = []
for (const f of allFiles) {
  const fullPath = path.join(COURSES_DIR, f)
  let data
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  } catch (e) {
    console.error(`[warn] skip unreadable ${f}: ${e.message}`)
    continue
  }
  const ytId = data?.lesson?.yt_video_id
  const courseId = data?.course?.id
  if (!ytId || !wantedIds.has(ytId)) continue
  matchedFiles.push(f)
  if (PROTECTED_IDS.has(courseId)) {
    console.error(`[skip-protected] ${courseId}`)
    skipped.push(courseId)
    continue
  }
  arr.push(data)
}

if (arr.length === 0) {
  console.error('[fatal] nothing matched. Did you run generate-courses-v2.mjs?')
  console.error(`        wanted yt ids: ${Array.from(wantedIds).join(', ')}`)
  console.error(`        index ids: ${indexIds.join(', ') || '(empty)'}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(OUT_PRIMARY), { recursive: true })
fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true })
const json = JSON.stringify(arr, null, 2)
fs.writeFileSync(OUT_PRIMARY, json)
fs.writeFileSync(OUT_PUBLIC, json)

console.error(`[ok] bundled ${arr.length} course payload(s)`)
console.error(`     primary: ${OUT_PRIMARY}`)
console.error(`     public:  ${OUT_PUBLIC}`)
console.error(`     bytes:   ${json.length}`)
if (skipped.length > 0) console.error(`     protected (not bundled): ${skipped.join(', ')}`)
console.error(`     ids:     ${arr.map((c) => c.course.id).join(', ')}`)
