#!/usr/bin/env node
/**
 * generate-reading-courses.mjs
 *
 * Orchestrates the Reading course generation pipeline:
 *   1. Reads Listening course JSON files from course-data/courses/
 *   2. Extracts transcript data and metadata
 *   3. Produces a scaffold Reading course JSON (without LLM-generated content)
 *   4. The actual paragraph extraction + quiz generation is handled by
 *      reading-enrich-plan.mjs (prompt) → Agent (LLM) → reading-enrich-apply.mjs (apply)
 *
 * Usage:
 *   node scripts/generate-reading-courses.mjs                    # all 20 selected courses
 *   node scripts/generate-reading-courses.mjs --only minecraft-10-animals  # single course
 *   node scripts/generate-reading-courses.mjs --list             # print selected IDs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inferReadingThumbnail } from '../src/lib/courseThumbnails.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const READING_DIR = path.join(ROOT, 'course-data', 'reading')

fs.mkdirSync(READING_DIR, { recursive: true })

// =============================================================================
// Selected 20 Listening courses for Reading generation (original batch)
// =============================================================================
const SELECTED_COURSES = [
  // Beginner (7) — difficulty 1, 3 segments
  { id: 'minecraft-easy-english-listening', difficulty: 1, segments: 3 },
  { id: 'minecraft-2-exploring-a-cave', difficulty: 1, segments: 3 },
  { id: 'minecraft-4-exploring-the-wild', difficulty: 1, segments: 3 },
  { id: 'minecraft-6-making-friends', difficulty: 1, segments: 3 },
  { id: 'minecraft-9-building-a-barn', difficulty: 1, segments: 3 },
  { id: 'minecraft-10-animals', difficulty: 1, segments: 3 },
  { id: 'minecraft-18-fishing', difficulty: 1, segments: 3 },
  // Intermediate (7) — difficulty 2, 4 segments
  { id: 'minecraft-13-rail-system', difficulty: 2, segments: 4 },
  { id: 'minecraft-15-searching-for-cherry-blossoms', difficulty: 2, segments: 4 },
  { id: 'minecraft-19-finishing-my-house', difficulty: 2, segments: 4 },
  { id: 'minecraft-22-bamboo', difficulty: 2, segments: 4 },
  { id: 'minecraft-24-nether-portal', difficulty: 2, segments: 4 },
  { id: 'minecraft-27-enchanting', difficulty: 2, segments: 4 },
  { id: 'minecraft-29-diamond-mine', difficulty: 2, segments: 4 },
  // Advanced (6) — difficulty 3, 5 segments
  { id: 'minecraft-32-taming-a-horse', difficulty: 3, segments: 5 },
  { id: 'minecraft-35-finding-a-stronghold', difficulty: 3, segments: 5 },
  { id: 'minecraft-37-the-end', difficulty: 3, segments: 5 },
  { id: 'minecraft-intermediate-english-minecraft-1', difficulty: 3, segments: 5 },
  { id: 'minecraft-intermediate-english-minecraft-5', difficulty: 3, segments: 5 },
  { id: 'minecraft-intermediate-english-minecraft-10', difficulty: 3, segments: 5 },
]

// =============================================================================
// Dynamic course discovery from _skill-import.json (--from-import mode)
// =============================================================================
function discoverCoursesFromImport(importPath) {
  const importPlan = JSON.parse(fs.readFileSync(importPath, 'utf8'))
  const wantedYtIds = new Set((importPlan.videos || []).map((v) => v.id))
  const durMap = new Map((importPlan.videos || []).map((v) => {
    const parts = (v.dur || '0:00').split(':')
    const secs = parts.length === 2 ? +parts[0] * 60 + +parts[1] : +parts[0]
    return [v.id, secs]
  }))

  const allFiles = fs
    .readdirSync(COURSES_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  const discovered = []
  for (const f of allFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(COURSES_DIR, f), 'utf8'))
    const ytId = data?.lesson?.yt_video_id
    const courseId = data?.course?.id
    if (!ytId || !wantedYtIds.has(ytId)) continue
    if (data?.course?.kind !== 'listening') continue

    // Auto-determine difficulty from video duration
    const durSec = durMap.get(ytId) || 0
    let difficulty, segments
    if (durSec < 360) {       // <6 min → beginner
      difficulty = 1; segments = 3
    } else if (durSec < 720) { // 6-12 min → intermediate
      difficulty = 2; segments = 4
    } else {                   // >12 min → advanced
      difficulty = 3; segments = 5
    }

    discovered.push({ id: courseId, difficulty, segments })
  }
  return discovered
}

// =============================================================================
// Quiz type assignment per segment position and difficulty
// =============================================================================
function assignQtypes(numSegments, difficulty) {
  if (numSegments === 3) {
    // Beginner: vocabulary_cloze, comprehension, true_false
    return ['vocabulary_cloze', 'comprehension', 'true_false']
  }
  if (numSegments === 4) {
    // Intermediate: vocabulary_cloze, comprehension, word_match, true_false
    return ['vocabulary_cloze', 'comprehension', 'word_match', 'true_false']
  }
  // Advanced (5): vocabulary_cloze, comprehension, word_match, sentence_order, vocabulary_cloze
  return ['vocabulary_cloze', 'comprehension', 'word_match', 'sentence_order', 'vocabulary_cloze']
}

// =============================================================================
// Build reading course ID from listening course ID
// =============================================================================
function readingId(listeningId) {
  return `reading-${listeningId}`
}

// =============================================================================
// Load a listening course JSON
// =============================================================================
function loadListeningCourse(id) {
  const filePath = path.join(COURSES_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) {
    console.error(`[SKIP] ${id} — file not found: ${filePath}`)
    return null
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

// =============================================================================
// Build the scaffold for a reading course (metadata only, content filled by LLM)
// =============================================================================
function buildReadingScaffold(listeningData, config) {
  const { id, difficulty, segments: numSegments } = config
  const lCourse = listeningData.course
  const lLesson = listeningData.lesson

  const rCourseId = readingId(id)
  const qtypes = assignQtypes(numSegments, difficulty)

  // Estimate time based on difficulty
  const estMinutes = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8

  // XP reward based on difficulty
  const xpReward = difficulty === 1 ? 30 : difficulty === 2 ? 40 : 50

  return {
    course: {
      id: rCourseId,
      kind: 'reading',
      title: `${lCourse.title} — Reading`,
      description: `Read and practice vocabulary from "${lCourse.title}" — ${numSegments} reading segments with mixed quizzes.`,
      difficulty,
      est_minutes: estMinutes,
      xp_reward: xpReward,
      unlock_level: difficulty,
      thumbnail_key: inferReadingThumbnail(rCourseId + ' ' + (lCourse.title || '')),
      source_label: `Based on ${lCourse.source_label || lCourse.title}`,
      source_url: lCourse.source_url || null,
      source_license: lCourse.source_license || 'youtube-embed',
      sort_order: 100 + (lCourse.sort_order || 0),
      is_active: true,
    },
    lesson: {
      step_index: 0,
      kind: 'reading_passage',
      title: `${lCourse.title} — Reading Practice`,
      passage_md: '', // Filled by LLM
      transcript_zh: '', // Filled by LLM
      highlight_words: [], // Filled by LLM
      xp_reward: 20,
    },
    segments: qtypes.map((qtype, i) => ({
      sort_order: i,
      start_sec: 0,
      end_sec: 0,
      sentence_en: '', // Filled by LLM
      sentence_zh: '', // Filled by LLM
      blank_word: null, // Filled by LLM (for vocabulary_cloze)
      distractors: [], // Filled by LLM (for vocabulary_cloze)
      qtype,
      quiz_payload: null, // Filled by LLM (for non-cloze types)
    })),
    question: null, // Cooldown MCQ — Filled by LLM
    // Metadata for the enrichment step
    _meta: {
      source_listening_id: id,
      difficulty,
      num_segments: numSegments,
      qtypes,
      transcript_en: lLesson.transcript_en || '',
      transcript_zh: lLesson.transcript_zh || '',
    },
  }
}

// =============================================================================
// Main
// =============================================================================
const args = process.argv.slice(2)

if (args.includes('--list')) {
  console.log('Selected courses for Reading generation:')
  for (const c of SELECTED_COURSES) {
    console.log(`  ${c.id} (difficulty=${c.difficulty}, segments=${c.segments})`)
  }
  process.exit(0)
}

// --from-import mode: dynamically discover courses from _skill-import.json
const fromImportIdx = args.indexOf('--from-import')
const fromImportPath = fromImportIdx >= 0 ? args[fromImportIdx + 1] : null

const onlyIdx = args.indexOf('--only')
const onlyId = onlyIdx >= 0 ? args[onlyIdx + 1] : null

let targets
if (fromImportPath) {
  const importFile = path.isAbsolute(fromImportPath)
    ? fromImportPath
    : path.resolve(process.cwd(), fromImportPath)
  if (!fs.existsSync(importFile)) {
    console.error(`[fatal] import file not found: ${importFile}`)
    process.exit(1)
  }
  const discovered = discoverCoursesFromImport(importFile)
  targets = onlyId ? discovered.filter((c) => c.id === onlyId) : discovered
  console.log(`[from-import] Discovered ${discovered.length} listening course(s) for reading generation`)
} else {
  targets = onlyId
    ? SELECTED_COURSES.filter((c) => c.id === onlyId)
    : SELECTED_COURSES
}

if (targets.length === 0) {
  console.error(`No matching course found for --only "${onlyId}"`)
  console.error('Available IDs:', SELECTED_COURSES.map((c) => c.id).join(', '))
  process.exit(1)
}

console.log(`\n=== Reading Course Generator ===`)
console.log(`Processing ${targets.length} course(s)...\n`)

const scaffolds = []
let ok = 0
let skip = 0

for (const config of targets) {
  const data = loadListeningCourse(config.id)
  if (!data) { skip++; continue }

  const scaffold = buildReadingScaffold(data, config)
  scaffolds.push(scaffold)

  // Write scaffold (without _meta) to reading dir
  const output = { ...scaffold }
  delete output._meta
  const outPath = path.join(READING_DIR, `${scaffold.course.id}.json`)
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`[OK] ${scaffold.course.id} → ${outPath}`)
  ok++
}

console.log(`\nDone: ${ok} scaffolds written, ${skip} skipped.`)

// Write the enrichment input file for the LLM step
if (scaffolds.length > 0) {
  const enrichInput = {
    generated_at: new Date().toISOString(),
    total: scaffolds.length,
    tasks: scaffolds.map((s) => ({
      reading_course_id: s.course.id,
      source_listening_id: s._meta.source_listening_id,
      difficulty: s._meta.difficulty,
      num_segments: s._meta.num_segments,
      qtypes: s._meta.qtypes,
      transcript_en: s._meta.transcript_en,
      transcript_zh: s._meta.transcript_zh,
      course_title: s.course.title,
    })),
  }
  const enrichPath = path.join(ROOT, 'course-data', '_reading-enrich-input.json')
  fs.writeFileSync(enrichPath, JSON.stringify(enrichInput, null, 2))
  console.log(`\nEnrichment input written: ${enrichPath}`)
  console.log(`Next step: run "node scripts/reading-enrich-plan.mjs" to generate LLM prompt.`)
}
