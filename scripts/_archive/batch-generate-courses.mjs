#!/usr/bin/env node
/**
 * batch-generate-courses.mjs
 *
 * Reads parsed VTT segments for each video and emits a course JSON suitable
 * for AdminCourseEditor's "Import Course JSON" feature. The course JSON
 * contains automatically-selected cloze segments (no full-blown manual quiz
 * design — fast, broad coverage, expects later human polishing).
 *
 * Heuristics:
 *   - Pick 4–6 micro-segments evenly spaced across the video timeline
 *     (skip first 5s and last 5s — usually intro/outro fluff)
 *   - For each picked segment, choose a teaching-worthy "blank word":
 *       * length >= 5
 *       * not a stopword
 *       * appears at most twice in the segment (avoid trivial repetition)
 *       * prefer verbs/nouns/adjectives by simple suffix heuristics
 *   - Generate 3 distractors from other "interesting" words in the same
 *     lesson's full transcript (similar length, not the answer itself)
 *   - First segment cloze, others are also cloze for consistency
 *
 * Output: course-data/courses/<id>.json (one per video, including #11 if you
 * pass --overwrite; otherwise skip existing JSONs).
 *
 * Usage:
 *   node scripts/batch-generate-courses.mjs [--overwrite]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PLAYLIST = path.join(ROOT, 'course-data', 'youtube-listening-playlist.json')
const SUBS_DIR = path.join(ROOT, 'course-data', 'subs')
const OUT_DIR = path.join(ROOT, 'course-data', 'courses')

const overwrite = process.argv.includes('--overwrite')

fs.mkdirSync(OUT_DIR, { recursive: true })

// -------- VTT parsing (reuse logic from src/lib/parseYouTubeVtt.js) --------
function parseTimestamp(s) {
  const [h, m, rest] = s.split(':')
  const [sec, ms = '0'] = rest.split('.')
  return +h * 3600 + +m * 60 + +sec + +ms / 1000
}

function parseTimedLine(line, cueStart) {
  const tokens = []
  let cur = ''
  let curStart = cueStart
  let i = 0
  // Strip leading <c> if any (uncommon)
  while (i < line.length) {
    const ch = line[i]
    if (ch === '<') {
      const end = line.indexOf('>', i)
      if (end === -1) break
      const tag = line.slice(i + 1, end)
      if (/^\d\d:\d\d:\d\d\.\d{3}$/.test(tag)) {
        if (cur.trim()) tokens.push({ start: curStart, word: cur.trim() })
        cur = ''
        curStart = parseTimestamp(tag)
      }
      i = end + 1
      continue
    }
    cur += ch
    i++
  }
  if (cur.trim()) tokens.push({ start: curStart, word: cur.trim() })
  return tokens
}

function parseVtt(text, opts = {}) {
  const minSec = Number(opts.minSec ?? 15)
  const maxSec = Number(opts.maxSec ?? 40)
  const blocks = text.split(/\r?\n\r?\n/)
  const wordStream = []
  for (const block of blocks) {
    const m = block.match(/(\d\d:\d\d:\d\d\.\d{3})\s+-->\s+(\d\d:\d\d:\d\d\.\d{3})/)
    if (!m) continue
    const cueStart = parseTimestamp(m[1])
    const cueLines = block.split(/\r?\n/)
    const tsIdx = cueLines.findIndex((l) => /-->/.test(l))
    for (const cl of cueLines.slice(tsIdx + 1)) {
      if (!/<\d\d:\d\d:\d\d\.\d{3}>/.test(cl)) continue
      for (const tk of parseTimedLine(cl, cueStart)) wordStream.push(tk)
    }
  }
  // SRT fallback
  if (wordStream.length === 0) {
    for (const block of blocks) {
      const m = block.match(/(\d\d:\d\d:\d\d[.,]\d{3})\s+-->\s+(\d\d:\d\d:\d\d[.,]\d{3})/)
      if (!m) continue
      const start = parseTimestamp(m[1].replace(',', '.'))
      const cueLines = block.split(/\r?\n/)
      const tsIdx = cueLines.findIndex((l) => /-->/.test(l))
      const text = cueLines.slice(tsIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim()
      if (!text) continue
      for (const w of text.split(/\s+/)) wordStream.push({ start, word: w })
    }
  }
  // Dedupe (same word at same start)
  const dedup = []
  for (const t of wordStream) {
    const last = dedup[dedup.length - 1]
    if (last && last.word.toLowerCase() === t.word.toLowerCase() && Math.abs(last.start - t.start) < 0.5) continue
    dedup.push(t)
  }
  // Build lines: split when gap > 0.6s
  const lines = []
  let cur = []
  for (let k = 0; k < dedup.length; k++) {
    const t = dedup[k]
    const prev = dedup[k - 1]
    if (prev && t.start - prev.start > 0.6 && cur.length > 0) {
      lines.push({ start: cur[0].start, end: prev.start + 0.5, text: cur.map((x) => x.word).join(' ') })
      cur = []
    }
    cur.push(t)
  }
  if (cur.length) {
    const last = cur[cur.length - 1]
    lines.push({ start: cur[0].start, end: last.start + 0.5, text: cur.map((x) => x.word).join(' ') })
  }
  // Group into segments
  const segments = []
  let group = []
  for (const ln of lines) {
    if (group.length === 0) { group.push(ln); continue }
    const gStart = group[0].start
    const newEnd = ln.end
    if (newEnd - gStart > maxSec) {
      const last = group[group.length - 1]
      segments.push({ start: gStart, end: last.end, sentence_en: group.map((x) => x.text).join(' ') })
      group = [ln]
    } else {
      group.push(ln)
      if (newEnd - gStart >= minSec) {
        segments.push({ start: gStart, end: ln.end, sentence_en: group.map((x) => x.text).join(' ') })
        group = []
      }
    }
  }
  if (group.length) {
    const last = group[group.length - 1]
    segments.push({ start: group[0].start, end: last.end, sentence_en: group.map((x) => x.text).join(' ') })
  }
  return { lines, segments }
}

// -------- Cloze auto-generation --------
const STOPWORDS = new Set(`
the a an and or but if then else for of to in on at by from with as is are was were be been being
i you he she it we they me him her us them my your his hers our their this that these those
do does did have has had will would shall should can could may might must
not no yes so very just only also too here there when where what which who why how
about into onto over under up down out off back away again still even much many more most less
some any all each every few several both either neither one two three four five six seven eight nine ten
go going went gone get got getting have like make take see say said come came going gonna wanna
because okay alright yeah hey well now today tomorrow yesterday minecraft kenzo fishland youtube
guy guys thing things stuff something anything nothing everything someone anyone everyone
really actually basically literally probably maybe perhaps sort kind lot lots
look looking looked watch watching watched think thought thinking want wanted know knew let lets
`.trim().split(/\s+/))

function pickBlankWord(text) {
  // Tokenize, lowercase
  const words = text.toLowerCase().match(/[a-z][a-z'-]*/g) || []
  // Count frequency
  const freq = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  // Score each unique word
  const candidates = []
  for (const w of new Set(words)) {
    if (w.length < 5) continue
    if (STOPWORDS.has(w)) continue
    if (/^\w+'(s|t|re|ve|ll|d|m)$/.test(w)) continue
    if (freq[w] > 2) continue
    let score = w.length
    // Prefer typical content-word suffixes
    if (/(ing|ed|tion|sion|ness|ment|able|less|ful|ous|ive|ity)$/.test(w)) score += 3
    candidates.push({ w, score })
  }
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.w || null
}

function pickDistractors(blank, fullTranscriptWords, count = 3) {
  const targetLen = blank.length
  const used = new Set([blank])
  const picks = []
  const candidates = fullTranscriptWords
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !used.has(w))
    .filter((w) => Math.abs(w.length - targetLen) <= 3)
    .filter((w) => !/^\w+'(s|t|re|ve|ll|d|m)$/.test(w))
  // Dedupe
  const uniq = Array.from(new Set(candidates))
  // Shuffle deterministically by hash-ish sort
  uniq.sort((a, b) => (a.length - b.length) || a.localeCompare(b))
  // Stride pick
  const stride = Math.max(1, Math.floor(uniq.length / (count + 2)))
  for (let i = 0; i < uniq.length && picks.length < count; i += stride) {
    if (!used.has(uniq[i])) { picks.push(uniq[i]); used.add(uniq[i]) }
  }
  // Fallback fillers
  const fillers = ['journey', 'adventure', 'castle', 'forest', 'village', 'monster', 'crystal', 'magic']
  for (const f of fillers) {
    if (picks.length >= count) break
    if (!used.has(f)) { picks.push(f); used.add(f) }
  }
  return picks.slice(0, count)
}

function findOriginalCase(lowerWord, sentence) {
  const re = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i')
  const m = sentence.match(re)
  return m ? m[0] : lowerWord
}

// -------- Per-video course generator --------
function chooseSegments(allSegments, maxPick = 5) {
  if (allSegments.length === 0) return []
  // Skip very-first (intro) if there are enough
  const usable = allSegments.filter((s) => s.end - s.start >= 12 && s.end - s.start <= 50)
  if (usable.length === 0) return allSegments.slice(0, Math.min(maxPick, allSegments.length))
  if (usable.length <= maxPick) return usable
  // Evenly spaced selection
  const out = []
  const stride = usable.length / maxPick
  for (let i = 0; i < maxPick; i++) {
    out.push(usable[Math.floor(i * stride)])
  }
  return out
}

function buildCoursePayload(video) {
  const vttPath = path.join(SUBS_DIR, `${video.id}.en.vtt`)
  if (!fs.existsSync(vttPath)) {
    console.error(`[skip] ${video.id} (no vtt)`)
    return null
  }
  const raw = fs.readFileSync(vttPath, 'utf8')
  const parsed = parseVtt(raw, { minSec: 15, maxSec: 40 })
  if (parsed.segments.length === 0) {
    console.error(`[skip] ${video.id} (no segments)`)
    return null
  }
  const fullTranscript = parsed.segments.map((s) => s.sentence_en).join(' ')
  const allWords = (fullTranscript.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [])

  const picked = chooseSegments(parsed.segments, 5)
  const segments = picked.map((seg) => {
    const blankLower = pickBlankWord(seg.sentence_en)
    if (!blankLower) {
      return {
        start_sec: Math.round(seg.start),
        end_sec: Math.round(seg.end),
        sentence_en: capitalize(seg.sentence_en),
        sentence_zh: '',
        blank_word: '',
        distractors: [],
        qtype: 'none',
        quiz_payload: null,
      }
    }
    const blank = findOriginalCase(blankLower, seg.sentence_en)
    const distractors = pickDistractors(blankLower, allWords, 3)
    return {
      start_sec: Math.round(seg.start),
      end_sec: Math.round(seg.end),
      sentence_en: capitalize(seg.sentence_en),
      sentence_zh: '',
      blank_word: blank,
      distractors,
      qtype: 'cloze',
      quiz_payload: null,
    }
  })

  // Highlight words: collect distinct blanks
  const highlight = Array.from(new Set(segments.map((s) => s.blank_word).filter((x) => x)))

  // Difficulty heuristic: short videos easier
  const totalSec = parsed.segments[parsed.segments.length - 1].end
  const difficulty = totalSec < 600 ? 1 : totalSec < 1200 ? 2 : 3
  const estMin = Math.max(5, Math.round(totalSec / 60 / 2))

  // Course id from video index/title
  const slug = slugify(video.title)
  const courseId = `minecraft-${slug}`.slice(0, 60).replace(/-+$/, '')

  return {
    course: {
      id: courseId,
      kind: 'listening',
      title: video.title.replace(/^Learn English with Minecraft\s*[-#]?\s*\d*\s*[-:]\s*/i, '').trim() || video.title,
      description: `Learn English with Minecraft — Episode ${video.i}. ${segments.length} listening segments with cloze fill quizzes (auto-generated, ready for review).`,
      difficulty,
      est_minutes: estMin,
      xp_reward: 30 + segments.length * 5,
      unlock_level: 1,
      source_label: `Learn English with Minecraft — Ep. ${video.i}`,
      source_url: `https://www.youtube.com/watch?v=${video.id}`,
      source_license: 'youtube-embed',
      sort_order: video.i,
      is_active: true,
    },
    lesson: {
      step_index: 0,
      kind: 'video_segment',
      title: video.title,
      yt_video_id: video.id,
      yt_start_sec: 0,
      yt_end_sec: Math.round(totalSec),
      transcript_en: capitalize(fullTranscript),
      transcript_zh: '',
      highlight_words: highlight,
      xp_reward: 20,
    },
    segments,
    // No cooldown question for auto-generated batch (pre-set to skip)
  }
}

function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/learn english with minecraft/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// -------- Main --------
const playlist = JSON.parse(fs.readFileSync(PLAYLIST, 'utf8'))
// Hand-authored courses we never want to overwrite, even with --overwrite
const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])
let okCount = 0
let skipCount = 0
const generatedIds = []
for (const video of playlist.videos) {
  const payload = buildCoursePayload(video)
  if (!payload) { skipCount++; continue }
  if (PROTECTED_IDS.has(payload.course.id)) {
    console.error(`[skip-protected] ${payload.course.id}`)
    skipCount++
    generatedIds.push(payload.course.id)
    continue
  }
  const outPath = path.join(OUT_DIR, `${payload.course.id}.json`)
  if (fs.existsSync(outPath) && !overwrite) {
    console.error(`[skip-exists] ${payload.course.id}`)
    skipCount++
    generatedIds.push(payload.course.id)
    continue
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.error(`[ok] ${payload.course.id}  (${payload.segments.length} segs)`)
  okCount++
  generatedIds.push(payload.course.id)
}
console.error(`\n=== Generated ${okCount} new course JSONs, skipped ${skipCount} ===`)
// Write index
fs.writeFileSync(path.join(OUT_DIR, '_index.json'), JSON.stringify({ count: generatedIds.length, ids: generatedIds }, null, 2))
console.error(`Index written: ${OUT_DIR}/_index.json`)
