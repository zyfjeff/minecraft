#!/usr/bin/env node
/**
 * generate-courses-v2.mjs
 *
 * v2 over batch-generate-courses.mjs. Priorities:
 *   1) Pick segments by *teaching value* (penalize intros/outros, reward
 *      action-rich sentences with concrete nouns).
 *   2) Trim each picked sentence so it does not end mid-clause and stays
 *      within a 12–25 word memorizable window.
 *   3) Choose blank words with stronger heuristics (mid-position, content
 *      suffixes, Minecraft-themed nouns/verbs, no proper nouns).
 *   4) Generate distractors that are *different per segment* by salting the
 *      shuffle with a per-segment seed and mixing transcript-local
 *      candidates with a curated global ESL pool.
 *   5) Highlight words now follow the trimmed/picked blanks; transcript_en
 *      stays the full unfiltered text so the LISTENING STUDIO still has the
 *      whole context.
 *
 * Output: course-data/courses/<id>.json (overwrites by default).
 *
 * Usage:
 *   node scripts/generate-courses-v2.mjs           # writes all (skips PROTECTED)
 *   node scripts/generate-courses-v2.mjs --only ZbBRqpCYsB0  # one video id
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PLAYLIST = (() => {
  const idx = process.argv.indexOf('--playlist')
  if (idx > 0 && process.argv[idx + 1]) {
    const p = process.argv[idx + 1]
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
  }
  return path.join(ROOT, 'course-data', 'youtube-listening-playlist.json')
})()
const SUBS_DIR = path.join(ROOT, 'course-data', 'subs')
const OUT_DIR = path.join(ROOT, 'course-data', 'courses')

const ONLY_VIDEO = (() => {
  const idx = process.argv.indexOf('--only')
  return idx > 0 ? process.argv[idx + 1] : null
})()

fs.mkdirSync(OUT_DIR, { recursive: true })

// =============================================================================
// VTT parsing — same logic as v1 (kept for compatibility)
// =============================================================================
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
  const minSec = Number(opts.minSec ?? 12)
  const maxSec = Number(opts.maxSec ?? 30)
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
  // Dedupe consecutive duplicates
  const dedup = []
  for (const t of wordStream) {
    const last = dedup[dedup.length - 1]
    if (last && last.word.toLowerCase() === t.word.toLowerCase() && Math.abs(last.start - t.start) < 0.5) continue
    dedup.push(t)
  }
  // Build lines based on timing gaps
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
  // Group into segments of [minSec, maxSec]
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

// =============================================================================
// Lexicons & heuristics
// =============================================================================

// Small stopword list focused on filler / function words.
const STOPWORDS = new Set(`
the a an and or but if then else for of to in on at by from with as is are was were be been being
i you he she it we they me him her us them my your his hers our their this that these those
do does did have has had will would shall should can could may might must
not no yes so very just only also too here there when where what which who why how
about into onto over under up down out off back away again still even much many more most less
some any all each every few several both either neither one two three four five six seven eight nine ten
go going went gone get got getting like make made take took taken see saw seen say said
come came going gonna wanna hey okay alright yeah well now today tomorrow yesterday
because uh um yeah hmm oh ok thing things stuff something anything nothing everything
someone anyone everyone really actually basically literally probably maybe perhaps sort kind
lot lots looking looked watch watching watched think thought thinking want wanted know knew let lets
guys guy little big small old new nice good bad great cool awesome super pretty
right left front back top bottom side guess put putting around already always never sometimes
need needed needs trying try tried done doing make making made
`.trim().split(/\s+/))

// YouTube boilerplate phrases. Segments matching any of these regexes lose
// teaching value (we don't want intros / sponsor calls / channel pitches).
const BOILERPLATE_PATTERNS = [
  /\b(welcome\s+(back\s+)?to)\b/i,
  /\b(my\s+name\s+is)\b/i,
  /\b(don't\s+forget\s+to|please\s+(like|subscribe))\b/i,
  /\b(subscribe|like\s+(and|the)\s+(video|channel)|comment\s+below)\b/i,
  /\b(thanks\s+for\s+watching|see\s+you\s+(in\s+the\s+)?next)\b/i,
  /\b(in\s+the\s+last\s+episode|in\s+the\s+previous\s+episode)\b/i,
  /\b(today\s+we'?re?\s+going\s+to|today\s+i'?m?\s+going\s+to)\b/i,
  /\b(hello\s+everyone|hi\s+everyone|hi\s+guys)\b/i,
]

// Minecraft-flavoured concrete vocabulary — bonus when blank word matches.
const MC_VOCAB = new Set(`
diamond emerald iron coal copper redstone gold lapis quartz nether portal
pickaxe shovel sword axe hoe shears bow arrow trident shield armor helmet
torch lantern furnace anvil chest crafting beacon enchant brew potion
zombie skeleton creeper spider enderman piglin villager wolf horse cow sheep pig chicken rabbit fox panda parrot
mine mining build building craft crafting smelt smelting brew brewing fight fighting tame taming explore exploring
forest desert jungle swamp mountain cave cavern river ocean ravine stronghold dungeon mineshaft fortress
village tower temple monument outpost shrine biome nether overworld
`.trim().split(/\s+/))

// Action verbs we like to see in segments.
const ACTION_VERBS = new Set(`
build mine craft place put grab pick collect drop drink eat throw shoot plant grow
attack defend escape hide run jump climb swim dive fish catch tame breed feed
explore search find lose enter exit open close light burn smelt enchant brew
trade buy sell give take fill empty wear equip drop carry hold use make break destroy
`.trim().split(/\s+/))

// Curated global distractor pool — common ESL nouns/verbs/adjectives by length.
// Mixed in alongside transcript-local candidates so the same 3 tokens never
// repeat across segments.
const DISTRACTOR_POOL = {
  4: ['rope', 'snow', 'sand', 'wood', 'leaf', 'bone', 'lava', 'milk', 'fire', 'cake', 'gold', 'iron', 'rock', 'wave', 'belt'],
  5: ['stone', 'beach', 'cloud', 'plant', 'sword', 'magic', 'storm', 'water', 'glass', 'metal', 'crown', 'piece', 'shore', 'apple', 'arrow'],
  6: ['castle', 'spirit', 'shield', 'forest', 'dragon', 'hammer', 'island', 'pirate', 'ribbon', 'bottle', 'bridge', 'helmet', 'jacket', 'ladder', 'mirror'],
  7: ['emerald', 'kingdom', 'compass', 'leather', 'lantern', 'pumpkin', 'whisper', 'rainbow', 'fortune', 'bracelet', 'eclipse', 'mineral', 'whistle', 'paddock'],
  8: ['skeleton', 'creature', 'mountain', 'treasure', 'firework', 'nightfall', 'champion', 'lightning', 'knapsack', 'survivor', 'campsite', 'volcanic'],
  9: ['adventure', 'lightning', 'mysticism', 'shoreline', 'whirlpool', 'meteorite', 'guardian', 'corridor', 'fireplace', 'farmstead'],
  10: ['friendship', 'expedition', 'enchanting', 'underwater', 'lighthouse', 'waterfall', 'horizontal', 'lemonshade', 'pinecastle'],
}

// =============================================================================
// Sentence trimming — stop dangling cruft
// =============================================================================

// Words that work well as the "first word" of a trimmed sentence.
const CLAUSE_STARTERS = new Set([
  'i', 'we', 'you', 'they', 'he', 'she', 'it',
  "i'm", "we're", "you're", "they're", "he's", "she's", "it's",
  'this', 'that', 'these', 'those',
  'now', 'then', 'first', 'next', 'finally', 'so', 'and', 'but',
  'when', 'while', 'after', 'before', 'because', 'if',
  'let', "let's", 'look', 'watch', 'okay', 'alright',
  'there', 'here',
])

// Words that work well as the "last word" of a trimmed sentence (i.e. NOT
// these). If the sentence ends on one of these, we trim trailing tokens
// until we find a content-word boundary.
const TRAILING_FUNC_WORDS = new Set([
  'a', 'an', 'and', 'or', 'but', 'the', 'to', 'of', 'for', 'in', 'on', 'at',
  'with', 'as', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'i', 'we', 'you', 'they', 'he', 'she', 'it', 'my', 'your', 'his', 'her',
  'so', 'that', 'this', 'these', 'those', 'which', 'who', 'whom',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  "i'm", "we're", "you're", "they're", "he's", "she's", "it's", 'just',
  'gonna', 'wanna', 'going', 'about', 'up', 'down', 'out', 'into',
  'do', 'does', 'did', 'have', 'has', 'had', 'not', 'no',
])

function trimSentence(text, targetWords = 18) {
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ''
  // Find best starting index: a clause starter close to the front (within 6 tokens)
  let startIdx = 0
  for (let i = 0; i < Math.min(8, tokens.length); i++) {
    const w = tokens[i].toLowerCase().replace(/[^a-z']/g, '')
    if (CLAUSE_STARTERS.has(w)) { startIdx = i; break }
  }
  // From start, take up to (targetWords + 6) tokens to give room for tail trim
  const endCap = Math.min(tokens.length, startIdx + targetWords + 6)
  let pieces = tokens.slice(startIdx, endCap)
  // Trim trailing functional words
  while (pieces.length > 4) {
    const last = pieces[pieces.length - 1].toLowerCase().replace(/[^a-z']/g, '')
    if (TRAILING_FUNC_WORDS.has(last)) pieces.pop()
    else break
  }
  // Hard cap to targetWords + 4
  if (pieces.length > targetWords + 4) pieces = pieces.slice(0, targetWords + 4)
  if (pieces.length < 6) {
    // Trimmed too aggressively — fall back to first targetWords of original
    pieces = tokens.slice(0, Math.min(targetWords, tokens.length))
  }
  let out = pieces.join(' ')
  // Capitalize first letter
  out = out.charAt(0).toUpperCase() + out.slice(1)
  // Add a period if not there
  if (!/[.!?]$/.test(out)) out += '.'
  return out
}

// =============================================================================
// Segment scoring — pick teaching-valuable segments
// =============================================================================

function scoreSegment(seg, _videoTotalSec) {
  const text = seg.sentence_en
  const lower = text.toLowerCase()
  const words = lower.match(/[a-z][a-z'-]*/g) || []
  let score = 0

  // Length sweet-spot
  const dur = seg.end - seg.start
  if (dur >= 14 && dur <= 26) score += 6
  else if (dur >= 12 && dur <= 32) score += 3
  else score -= 3

  // Word count sweet-spot
  if (words.length >= 18 && words.length <= 70) score += 4
  else if (words.length < 12 || words.length > 90) score -= 4

  // Boilerplate penalty
  for (const re of BOILERPLATE_PATTERNS) {
    if (re.test(text)) score -= 12
  }

  // Action verb bonus
  let actionHits = 0
  for (const w of words) if (ACTION_VERBS.has(w)) actionHits++
  score += Math.min(6, actionHits * 2)

  // Minecraft vocab bonus
  let mcHits = 0
  for (const w of words) if (MC_VOCAB.has(w)) mcHits++
  score += Math.min(6, mcHits * 2)

  // Diversity penalty: if same word repeats > 3 times in this segment, content is shallow
  const freq = {}
  for (const w of words) freq[w] = (freq[w] || 0) + 1
  let hotRepeats = 0
  for (const w in freq) if (freq[w] >= 4 && !STOPWORDS.has(w)) hotRepeats++
  score -= hotRepeats * 2

  // Stutter / filler penalty: too many "i" or "you know"
  if (/(you know).*\1/i.test(text)) score -= 2
  const iCount = words.filter((w) => w === 'i').length
  if (iCount > words.length * 0.12) score -= 2

  return score
}

function chooseSegments(allSegments, videoTotalSec, target = 5) {
  if (allSegments.length === 0) return []
  // Skip first 12s (intro) and last 8s (outro) by start_sec
  const usable = allSegments.filter((s) => s.start >= 12 && s.end <= videoTotalSec - 5)
  if (usable.length === 0) return allSegments.slice(0, Math.min(target, allSegments.length))
  // Score
  const scored = usable.map((s) => ({ ...s, _score: scoreSegment(s, videoTotalSec) }))
  // Sort by score desc, but enforce time-spread: greedy pick top, skip if within 60s of a picked one
  const sortedByScore = [...scored].sort((a, b) => b._score - a._score)
  const picked = []
  const minGapSec = Math.max(45, Math.floor(videoTotalSec / (target * 2)))
  for (const cand of sortedByScore) {
    if (picked.length >= target) break
    const tooClose = picked.some((p) => Math.abs(p.start - cand.start) < minGapSec)
    if (tooClose) continue
    if (cand._score < -5) continue // never pick boilerplate-dominated
    picked.push(cand)
  }
  // If under-target, fill with next-best ignoring gap
  if (picked.length < target) {
    for (const cand of sortedByScore) {
      if (picked.length >= target) break
      if (picked.includes(cand)) continue
      if (cand._score < -10) continue
      picked.push(cand)
    }
  }
  // Sort picked by start_sec for natural narrative order
  picked.sort((a, b) => a.start - b.start)
  return picked
}

// =============================================================================
// Cloze generation
// =============================================================================

function pickBlankWord(sentence, usedBlanks = new Set()) {
  const tokens = sentence.match(/[A-Za-z][A-Za-z'-]*/g) || []
  const lower = tokens.map((t) => t.toLowerCase())
  if (tokens.length === 0) return null
  const freq = {}
  for (const w of lower) freq[w] = (freq[w] || 0) + 1
  const candidates = []
  // Prefer words in the middle 30%-70% of the sentence
  const lo = Math.floor(tokens.length * 0.25)
  const hi = Math.floor(tokens.length * 0.85)
  for (let i = 0; i < tokens.length; i++) {
    const orig = tokens[i]
    const w = lower[i]
    if (w.length < 5 || w.length > 12) continue
    if (STOPWORDS.has(w)) continue
    if (/^[A-Z]/.test(orig) && i !== 0) continue // proper noun (mid-sentence Capitalized)
    if (/^\w+'(s|t|re|ve|ll|d|m)$/.test(w)) continue
    if (freq[w] > 2) continue
    let score = 0
    // Length bonus
    if (w.length >= 6 && w.length <= 10) score += 4
    else score += 1
    // Position bonus
    if (i >= lo && i <= hi) score += 4
    // Suffix bonus (content-word morphology)
    if (/(ing|ed|tion|sion|ness|ment|able|less|ful|ous|ive|ity|ist|ize)$/.test(w)) score += 5
    // Minecraft vocab bonus
    if (MC_VOCAB.has(w)) score += 6
    if (ACTION_VERBS.has(w)) score += 4
    // Penalize generic discourse markers
    if (['actually', 'basically', 'literally', 'probably', 'something', 'anything', 'nothing'].includes(w)) score -= 8
    // Strong penalty if word already used as a blank in another segment of
    // this lesson — we want highlight_words to span 5 distinct vocab items.
    if (usedBlanks.has(w)) score -= 15
    candidates.push({ w, orig, idx: i, score })
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score || a.idx - b.idx)
  return candidates[0]
}

function hashStr(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

function pickDistractors(blank, fullTranscriptWords, segIdx, lessonId, usedAcrossSegments) {
  const target = blank.toLowerCase()
  const targetLen = target.length
  // Local pool: transcript words with similar length, content-y
  const localSet = new Set()
  for (const w of fullTranscriptWords) {
    if (w === target) continue
    if (STOPWORDS.has(w)) continue
    if (Math.abs(w.length - targetLen) > 2) continue
    if (/^\w+'(s|t|re|ve|ll|d|m)$/.test(w)) continue
    if (w.length < 4) continue
    localSet.add(w)
  }
  // Global pool by length bucket
  const globalCandidates = []
  for (const len of [targetLen, targetLen - 1, targetLen + 1, targetLen - 2, targetLen + 2]) {
    if (DISTRACTOR_POOL[len]) {
      for (const w of DISTRACTOR_POOL[len]) {
        if (w === target) continue
        globalCandidates.push(w)
      }
    }
  }
  // Per-segment seed for shuffle so distractors differ across segments
  const seed = hashStr(`${lessonId}#${segIdx}#${blank}`)
  const seededShuffle = (arr) => {
    const a = [...arr]
    let s = seed
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) >>> 0
      const j = s % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const localList = seededShuffle([...localSet])
  const globalList = seededShuffle(globalCandidates)

  const picks = []
  const used = new Set([target, ...usedAcrossSegments])
  // 2 from global pool first (guaranteed variety), then 1 from local
  for (const w of globalList) {
    if (picks.length >= 2) break
    if (used.has(w)) continue
    picks.push(w); used.add(w)
  }
  for (const w of localList) {
    if (picks.length >= 3) break
    if (used.has(w)) continue
    picks.push(w); used.add(w)
  }
  // If still short, top up from any remaining global pool
  if (picks.length < 3) {
    const extra = ['journey', 'shadow', 'whisper', 'crystal', 'puzzle', 'castle', 'pirate', 'breeze']
    for (const w of seededShuffle(extra)) {
      if (picks.length >= 3) break
      if (used.has(w)) continue
      picks.push(w); used.add(w)
    }
  }
  return picks.slice(0, 3)
}

// =============================================================================
// Build payload
// =============================================================================

function buildCoursePayload(video) {
  const vttPath = path.join(SUBS_DIR, `${video.id}.en.vtt`)
  if (!fs.existsSync(vttPath)) { console.error(`[skip] ${video.id} (no vtt)`); return null }
  const raw = fs.readFileSync(vttPath, 'utf8')
  const parsed = parseVtt(raw, { minSec: 12, maxSec: 30 })
  if (parsed.segments.length === 0) { console.error(`[skip] ${video.id} (no segments)`); return null }

  const totalSec = parsed.segments[parsed.segments.length - 1].end
  const fullTranscript = parsed.segments.map((s) => s.sentence_en).join(' ')
  const transcriptWords = (fullTranscript.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [])
    .filter((w) => !STOPWORDS.has(w))

  const picked = chooseSegments(parsed.segments, totalSec, 5)

  const slug = slugify(video.title)
  const courseId = `minecraft-${slug}`.slice(0, 60).replace(/-+$/, '')
  const lessonId = `${courseId}/01`

  const usedDistractors = new Set()
  const usedBlanks = new Set()
  const segments = picked.map((seg, idx) => {
    const trimmed = trimSentence(seg.sentence_en, 18)
    const blankInfo = pickBlankWord(trimmed, usedBlanks)
    if (blankInfo) usedBlanks.add(blankInfo.w)
    if (!blankInfo) {
      return {
        start_sec: Math.round(seg.start),
        end_sec: Math.round(seg.end),
        sentence_en: trimmed,
        sentence_zh: '',
        blank_word: '',
        distractors: [],
        qtype: 'none',
        quiz_payload: null,
      }
    }
    const distractors = pickDistractors(blankInfo.w, transcriptWords, idx, lessonId, usedDistractors)
    distractors.forEach((d) => usedDistractors.add(d))
    return {
      start_sec: Math.round(seg.start),
      end_sec: Math.round(seg.end),
      sentence_en: trimmed,
      sentence_zh: '',
      blank_word: blankInfo.orig,
      distractors,
      qtype: 'cloze',
      quiz_payload: null,
    }
  })

  const highlight = Array.from(new Set(segments.map((s) => s.blank_word).filter(Boolean)))

  const difficulty = totalSec < 600 ? 1 : totalSec < 1200 ? 2 : 3
  const estMin = Math.max(5, Math.round(totalSec / 60 / 2))

  return {
    course: {
      id: courseId,
      kind: 'listening',
      title: video.title.replace(/^Learn English with Minecraft\s*[-#]?\s*\d*\s*[-:]\s*/i, '').trim() || video.title,
      description: `Learn English with Minecraft — Episode ${video.i}. ${segments.length} curated listening segments with cloze quizzes.`,
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

// =============================================================================
// Main
// =============================================================================
const playlist = JSON.parse(fs.readFileSync(PLAYLIST, 'utf8'))
const PROTECTED_IDS = new Set(['minecraft-i-lost-my-world'])
let okCount = 0
let skipCount = 0
const generatedIds = []
for (const video of playlist.videos) {
  if (ONLY_VIDEO && video.id !== ONLY_VIDEO) continue
  const payload = buildCoursePayload(video)
  if (!payload) { skipCount++; continue }
  if (PROTECTED_IDS.has(payload.course.id)) {
    console.error(`[skip-protected] ${payload.course.id}`)
    skipCount++
    generatedIds.push(payload.course.id)
    continue
  }
  const outPath = path.join(OUT_DIR, `${payload.course.id}.json`)
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.error(`[ok] ${payload.course.id}  (${payload.segments.length} segs, score>${payload.segments.length} pickedFromValue)`)
  okCount++
  generatedIds.push(payload.course.id)
}
console.error(`\n=== v2 Generated ${okCount} new course JSONs, skipped ${skipCount} ===`)
fs.writeFileSync(path.join(OUT_DIR, '_index.json'), JSON.stringify({ count: generatedIds.length, ids: generatedIds, version: 'v2' }, null, 2))
console.error(`Index written: ${OUT_DIR}/_index.json`)
