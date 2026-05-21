#!/usr/bin/env node
/**
 * reading-enrich-apply.mjs
 *
 * Reads course-data/_reading-enrich-output.json (produced by the agent/LLM)
 * and applies the enrichment data to the Reading course JSON scaffolds
 * in course-data/reading/.
 *
 * Validates:
 *   - Each result has the correct number of segments
 *   - Each segment has sentence_en, sentence_zh
 *   - Quiz payloads match qtype structure
 *   - highlight_words has 5 entries
 *   - Cooldown question has valid structure
 *
 * Usage:
 *   node scripts/reading-enrich-apply.mjs --check   # dry-run, validate only
 *   node scripts/reading-enrich-apply.mjs           # apply and write
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const READING_DIR = path.join(ROOT, 'course-data', 'reading')
const OUTPUT_PATH = path.join(ROOT, 'course-data', '_reading-enrich-output.json')
const INPUT_PATH = path.join(ROOT, 'course-data', '_reading-enrich-input.json')

const dryRun = process.argv.includes('--check')

if (!fs.existsSync(OUTPUT_PATH)) {
  console.error(`Output file not found: ${OUTPUT_PATH}`)
  console.error('The agent must produce this file first.')
  process.exit(1)
}

const output = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
const input = fs.existsSync(INPUT_PATH)
  ? JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))
  : null

if (!output.results || !Array.isArray(output.results)) {
  console.error('Invalid output: root must have "results" array.')
  process.exit(1)
}

// =============================================================================
// Validation helpers
// =============================================================================
function validateSegment(seg, idx, courseId) {
  const errors = []
  if (!seg.sentence_en || seg.sentence_en.trim().length < 20) {
    errors.push(`segment[${idx}]: sentence_en is too short or missing`)
  }
  if (!seg.sentence_zh || seg.sentence_zh.trim().length < 5) {
    errors.push(`segment[${idx}]: sentence_zh is missing`)
  }

  const qtype = seg.qtype
  if (qtype === 'vocabulary_cloze') {
    if (!seg.blank_word || seg.blank_word.trim().length === 0) {
      errors.push(`segment[${idx}]: vocabulary_cloze requires blank_word`)
    }
    if (!Array.isArray(seg.distractors) || seg.distractors.length < 3) {
      errors.push(`segment[${idx}]: vocabulary_cloze requires 3 distractors`)
    }
  } else if (qtype === 'comprehension') {
    const p = seg.quiz_payload
    if (!p || !p.prompt || !Array.isArray(p.options) || p.options.length !== 4) {
      errors.push(`segment[${idx}]: comprehension requires quiz_payload with prompt and 4 options`)
    }
    if (p && (p.correct < 0 || p.correct > 3)) {
      errors.push(`segment[${idx}]: comprehension correct must be 0-3`)
    }
  } else if (qtype === 'true_false') {
    const p = seg.quiz_payload
    if (!p || !p.statement || typeof p.correct !== 'boolean') {
      errors.push(`segment[${idx}]: true_false requires quiz_payload with statement and boolean correct`)
    }
  } else if (qtype === 'word_match') {
    const p = seg.quiz_payload
    if (!p || !Array.isArray(p.pairs) || p.pairs.length < 3) {
      errors.push(`segment[${idx}]: word_match requires quiz_payload with at least 3 pairs`)
    }
    if (!p || !Array.isArray(p.shuffled_defs) || p.shuffled_defs.length < 3) {
      errors.push(`segment[${idx}]: word_match requires shuffled_defs array`)
    }
  } else if (qtype === 'sentence_order') {
    const p = seg.quiz_payload
    if (!p || !Array.isArray(p.sentences) || p.sentences.length < 3) {
      errors.push(`segment[${idx}]: sentence_order requires quiz_payload with at least 3 sentences`)
    }
    if (!p || !Array.isArray(p.correct_order)) {
      errors.push(`segment[${idx}]: sentence_order requires correct_order array`)
    }
  }
  return errors
}

function validateResult(result) {
  const errors = []
  const id = result.reading_course_id

  if (!id) {
    errors.push('Missing reading_course_id')
    return errors
  }

  // Check passage_md
  if (!result.passage_md || result.passage_md.trim().length < 100) {
    errors.push(`${id}: passage_md is too short or missing`)
  }

  // Check passage_zh
  if (!result.passage_zh || result.passage_zh.trim().length < 50) {
    errors.push(`${id}: passage_zh is too short or missing`)
  }

  // Check highlight_words
  if (!Array.isArray(result.highlight_words) || result.highlight_words.length < 3) {
    errors.push(`${id}: highlight_words must have at least 3 entries (got ${result.highlight_words?.length || 0})`)
  }

  // Check segments
  if (!Array.isArray(result.segments) || result.segments.length < 3) {
    errors.push(`${id}: must have at least 3 segments (got ${result.segments?.length || 0})`)
  } else {
    for (let i = 0; i < result.segments.length; i++) {
      errors.push(...validateSegment(result.segments[i], i, id))
    }
  }

  // Check cooldown question
  if (result.question) {
    const q = result.question
    if (q.kind !== 'mcq') {
      errors.push(`${id}: question.kind must be "mcq"`)
    }
    if (!q.prompt || q.prompt.length < 10) {
      errors.push(`${id}: question.prompt is too short`)
    }
    if (!q.payload || !Array.isArray(q.payload.options) || q.payload.options.length !== 4) {
      errors.push(`${id}: question must have 4 options`)
    }
    if (q.payload && (q.payload.correct < 0 || q.payload.correct > 3)) {
      errors.push(`${id}: question.payload.correct must be 0-3`)
    }
  }

  return errors
}

// =============================================================================
// Process each result
// =============================================================================
console.log(`\n=== Reading Enrich Apply ${dryRun ? '(DRY RUN)' : ''} ===`)
console.log(`Processing ${output.results.length} result(s)...\n`)

let okCount = 0
let failCount = 0
const allErrors = []

for (const result of output.results) {
  const id = result.reading_course_id
  const errors = validateResult(result)

  if (errors.length > 0) {
    console.error(`[FAIL] ${id}:`)
    for (const e of errors) console.error(`  - ${e}`)
    allErrors.push(...errors)
    failCount++
    continue
  }

  if (dryRun) {
    console.log(`[OK] ${id} — validation passed`)
    okCount++
    continue
  }

  // Load the scaffold and apply enrichment
  const scaffoldPath = path.join(READING_DIR, `${id}.json`)
  if (!fs.existsSync(scaffoldPath)) {
    console.error(`[FAIL] ${id} — scaffold not found: ${scaffoldPath}`)
    failCount++
    continue
  }

  const scaffold = JSON.parse(fs.readFileSync(scaffoldPath, 'utf8'))

  // Apply lesson fields
  scaffold.lesson.passage_md = result.passage_md
  scaffold.lesson.transcript_zh = result.passage_zh
  scaffold.lesson.highlight_words = result.highlight_words

  // Apply segments
  scaffold.segments = result.segments.map((seg, i) => ({
    sort_order: i,
    start_sec: 0,
    end_sec: 0,
    sentence_en: seg.sentence_en,
    sentence_zh: seg.sentence_zh,
    blank_word: seg.blank_word || null,
    distractors: Array.isArray(seg.distractors) ? seg.distractors : [],
    qtype: seg.qtype,
    quiz_payload: seg.quiz_payload || null,
  }))

  // Apply cooldown question
  if (result.question) {
    scaffold.question = {
      kind: 'mcq',
      prompt: result.question.prompt,
      payload: result.question.payload,
      xp_reward: result.question.xp_reward || 10,
      sort_order: 0,
    }
  }

  // Write the enriched JSON
  fs.writeFileSync(scaffoldPath, JSON.stringify(scaffold, null, 2))
  console.log(`[OK] ${id} — enriched and saved`)
  okCount++
}

console.log(`\n=== Summary ===`)
console.log(`OK: ${okCount}, Failed: ${failCount}`)
if (allErrors.length > 0) {
  console.log(`Total errors: ${allErrors.length}`)
  if (dryRun) {
    console.log(`\nFix the errors in _reading-enrich-output.json and re-run.`)
  }
}
if (!dryRun && okCount > 0) {
  console.log(`\nNext step: run "node scripts/reading-bundle.mjs" to bundle for import.`)
}
