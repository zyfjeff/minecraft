#!/usr/bin/env node
/**
 * enrich-plan.mjs — Step 3.5a of the import-youtube-course skill.
 *
 * After generate-courses-v2.mjs writes course JSON files (with empty
 * transcript_zh / sentence_zh and no cooldown question), this script collects
 * the courses produced by THIS run and emits a single prompt-style input file
 * that the agent (you) translates + answers in place.
 *
 * Inputs:
 *   ARG1 = path to course-data/_skill-import.json (default)
 *
 * Output:
 *   course-data/_enrich-input.json
 *
 * Shape:
 *   {
 *     "instruction": "<<read carefully>>",
 *     "schema":      "<<expected output>>",
 *     "tasks": [
 *       {
 *         "course_id": "...",
 *         "course_title": "...",
 *         "transcript_en": "...full text...",
 *         "segments": [
 *           { "sort_order": 0, "sentence_en": "...", "blank_word": "diamond" },
 *           ...
 *         ]
 *       }
 *     ]
 *   }
 *
 * Agent workflow after running this:
 *   1. Read _enrich-input.json
 *   2. For each task, produce a {transcript_zh, segments_zh[], question}
 *      object following the schema strictly
 *   3. Write the full result to course-data/_enrich-output.json
 *   4. Run enrich-apply.mjs to patch course JSONs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')

function argVal(flag) {
  const idx = process.argv.indexOf(flag)
  return idx > 0 && process.argv[idx + 1] ? process.argv[idx + 1] : null
}

// First positional arg = playlist file (default course-data/_skill-import.json)
const posArg = process.argv.slice(2).find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && a !== argVal('--limit') && a !== argVal('--offset') && a !== argVal('--ids'))
const INPUT = path.resolve(process.cwd(), posArg || 'course-data/_skill-import.json')
const LIMIT = argVal('--limit') ? Number(argVal('--limit')) : null
const OFFSET = argVal('--offset') ? Number(argVal('--offset')) : 0
const IDS_FILTER = argVal('--ids') ? new Set(argVal('--ids').split(',').map((s) => s.trim()).filter(Boolean)) : null
const COURSES_DIR = path.join(ROOT, 'course-data', 'courses')
const OUT_PATH = path.join(ROOT, 'course-data', '_enrich-input.json')

const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])

if (!fs.existsSync(INPUT)) {
  console.error(`[fatal] input not found: ${INPUT}`)
  process.exit(2)
}

const importPlan = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
const wantedYtIds = new Set((importPlan.videos || []).map((v) => v.id))

const allFiles = fs
  .readdirSync(COURSES_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

const tasks = []
for (const f of allFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(COURSES_DIR, f), 'utf8'))
  const ytId = data?.lesson?.yt_video_id
  const courseId = data?.course?.id
  if (!ytId || !wantedYtIds.has(ytId)) continue
  if (PROTECTED_IDS.has(courseId)) continue
  if (IDS_FILTER && !IDS_FILTER.has(courseId)) continue
  // Skip courses that already have non-empty Chinese translation, unless
  // explicitly forced via --force.
  const alreadyTranslated = (data.lesson?.transcript_zh || '').trim().length > 5 &&
    (data.segments || []).every((s) => (s.sentence_zh || '').trim().length > 0) &&
    !!data.question
  if (alreadyTranslated && !process.argv.includes('--force')) continue
  tasks.push({
    course_id: courseId,
    course_title: data.course?.title || '',
    yt_video_id: ytId,
    transcript_en: data.lesson?.transcript_en || '',
    // NOTE: course JSON segments do NOT carry a sort_order field; we use the
    // array index as the stable key for matching translations back via
    // enrich-apply. The same index is used by Bulk Import (AdminCourseList)
    // when it inserts lesson_segments rows.
    segments: (data.segments || []).map((s, i) => ({
      sort_order: i,
      sentence_en: s.sentence_en,
      blank_word: s.blank_word || '',
    })),
  })
}

// Sort tasks deterministically by course_id, then apply offset/limit window
tasks.sort((a, b) => a.course_id.localeCompare(b.course_id))
const totalBeforeWindow = tasks.length
const windowed = LIMIT != null ? tasks.slice(OFFSET, OFFSET + LIMIT) : tasks.slice(OFFSET)

if (windowed.length === 0) {
  console.error('[fatal] no matching course JSON files found (after filtering / windowing).')
  console.error(`        wanted yt ids: ${Array.from(wantedYtIds).join(', ')}`)
  console.error(`        total before window: ${totalBeforeWindow}, offset=${OFFSET}, limit=${LIMIT ?? '(none)'}`)
  process.exit(1)
}

const payload = {
  instruction: [
    'You are translating Minecraft-themed English listening lessons into',
    'natural simplified Chinese for Chinese-speaking ESL learners (B1 level).',
    '',
    'For EACH task in tasks[], produce ONE result object with these fields:',
    '  - course_id:      copy from task',
    '  - transcript_zh:  full Chinese translation of transcript_en. Keep it',
    '                    fluent, natural, Minecraft-aware. Preserve speaker',
    '                    voice. Do NOT translate proper nouns like',
    '                    "Minecraft", "Creeper", "Steve", "Notch", or English',
    '                    item names that learners need to recognize.',
    '  - segments_zh:    array, one entry per segment with',
    '                      { sort_order, sentence_zh }',
    '                    sentence_zh translates sentence_en. KEEP the literal',
    '                    "__BLANK__" placeholder in Chinese exactly as-is so',
    '                    the front-end can render the blank.',
    '  - question:       a SINGLE multiple-choice cooldown question that tests',
    '                    overall comprehension of the video. Shape:',
    '                      {',
    '                        "kind": "mcq",',
    '                        "prompt": "...English question...",',
    '                        "payload": {',
    '                          "options": ["A", "B", "C", "D"],',
    '                          "correct": <0..3>',
    '                        },',
    '                        "xp_reward": 10',
    '                      }',
    '                    Prompt should test main idea / speaker intent / a',
    '                    concrete fact mentioned. Distractors must be',
    '                    plausible but clearly wrong if you watched the video.',
    '                    Provide EXACTLY 4 options. correct is the index.',
    '',
    'Return: write course-data/_enrich-output.json with shape:',
    '  { "results": [<one_result_per_task>] }',
    '',
    'Do not invent facts not present in transcript_en. If transcript_en is',
    'too short or noisy to support a meaningful question, still produce one',
    'based on whatever IS present (e.g. an action the speaker performed).',
  ].join('\n'),
  schema: {
    results: [{
      course_id: 'string',
      transcript_zh: 'string',
      segments_zh: [{ sort_order: 'number', sentence_zh: 'string' }],
      question: {
        kind: 'mcq',
        prompt: 'string (English)',
        payload: { options: ['A', 'B', 'C', 'D'], correct: 'number 0..3' },
        xp_reward: 10,
      },
    }],
  },
  tasks: windowed,
}

fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2))
console.error(`[ok] wrote ${OUT_PATH}`)
console.error(`     tasks in this batch: ${windowed.length} (of ${totalBeforeWindow} pending; offset=${OFFSET}, limit=${LIMIT ?? 'none'})`)
console.error(`     bytes: ${fs.statSync(OUT_PATH).size}`)
console.error(`     ids: ${windowed.map((t) => t.course_id).join(', ')}`)
console.error('')
console.error('Next steps for the agent:')
console.error('  1. Read course-data/_enrich-input.json')
console.error('  2. Produce course-data/_enrich-output.json (see schema)')
console.error('  3. Run scripts/enrich-apply.mjs')
