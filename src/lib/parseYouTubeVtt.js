// =============================================================================
// parseYouTubeVtt.js — Parse YouTube auto-generated VTT (ASR) into clean
// micro-segments suitable for listening-course authoring.
//
// Why this exists:
//   YouTube ASR captions are "rolling": each cue contains the previous frame's
//   text plus the new words wrapped in <hh:mm:ss.ms><c>word</c> tags. Naive
//   stripping yields heavy duplication. This module reads only the timed
//   word-level tokens (the actual new content) and rebuilds a clean stream.
//
// Public API:
//   parseYouTubeVtt(text, { minSec=15, maxSec=40 } = {})
//     -> { lines, segments }
//        lines:    [{ start, end, text }]
//        segments: [{ idx, start, end, duration, sentence_en, lines: [...] }]
// =============================================================================

function parseTimestamp(s) {
  const [h, m, rest] = s.split(':')
  const [sec, ms] = rest.split('.')
  return (+h) * 3600 + (+m) * 60 + (+sec) + (+ms) / 1000
}

// Parse a "timed line" inside a vtt cue: 'firstWord<00:00:02.600><c> I</c>...'
function parseTimedLine(line, cueStart) {
  const tokens = []
  const re = /<(\d\d):(\d\d):(\d\d)\.(\d{3})>/g
  const marks = []
  let m
  while ((m = re.exec(line)) !== null) {
    marks.push({
      idx: m.index,
      end: m.index + m[0].length,
      t: (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000,
    })
  }
  const stripTags = (t) => t.replace(/<\/?c[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (marks.length === 0) {
    const txt = stripTags(line)
    if (txt) tokens.push({ word: txt, t: cueStart })
    return tokens
  }
  const firstWord = stripTags(line.slice(0, marks[0].idx))
  if (firstWord) tokens.push({ word: firstWord, t: cueStart })
  for (let i = 0; i < marks.length; i++) {
    const segStart = marks[i].end
    const segEnd = i + 1 < marks.length ? marks[i + 1].idx : line.length
    const word = stripTags(line.slice(segStart, segEnd))
    if (word) tokens.push({ word, t: marks[i].t })
  }
  return tokens
}

export function parseYouTubeVtt(text, opts = {}) {
  const minSec = Number(opts.minSec ?? 15)
  const maxSec = Number(opts.maxSec ?? 40)
  if (!text || typeof text !== 'string') return { lines: [], segments: [] }

  // -------------------------------------------------------------------------
  // 1) Extract the timed word stream from cues
  // -------------------------------------------------------------------------
  const wordStream = []
  const blocks = text.split(/\r?\n\r?\n/)
  for (const block of blocks) {
    const m = block.match(/(\d\d:\d\d:\d\d\.\d{3})\s+-->\s+(\d\d:\d\d:\d\d\.\d{3})/)
    if (!m) continue
    const cueStart = parseTimestamp(m[1])
    const cueLines = block.split(/\r?\n/)
    const tsIdx = cueLines.findIndex(l => /-->/.test(l))
    if (tsIdx < 0) continue
    for (const cl of cueLines.slice(tsIdx + 1)) {
      // Only lines that carry word-level timestamps represent NEW content.
      if (!/<\d\d:\d\d:\d\d\.\d{3}>/.test(cl)) continue
      for (const tk of parseTimedLine(cl, cueStart)) wordStream.push(tk)
    }
  }

  // Fallback: if the input is plain SRT (no word-level tags), treat each cue
  // as one line so non-YouTube-ASR captions still work.
  if (wordStream.length === 0) {
    const plainLines = []
    for (const block of blocks) {
      const m = block.match(/(\d\d:\d\d:\d\d[.,]\d{3})\s+-->\s+(\d\d:\d\d:\d\d[.,]\d{3})/)
      if (!m) continue
      const start = parseTimestamp(m[1].replace(',', '.'))
      const end = parseTimestamp(m[2].replace(',', '.'))
      const cueLines = block.split(/\r?\n/)
      const tsIdx = cueLines.findIndex(l => /-->/.test(l))
      if (tsIdx < 0) continue
      const txt = cueLines.slice(tsIdx + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (txt) plainLines.push({ start: +start.toFixed(3), end: +end.toFixed(3), text: txt })
    }
    return { lines: plainLines, segments: groupSegments(plainLines, minSec, maxSec) }
  }

  // De-duplicate (same word at same time)
  const seen = new Set()
  const dedup = []
  for (const w of wordStream) {
    const k = w.t.toFixed(3) + '|' + w.word
    if (seen.has(k)) continue
    seen.add(k)
    dedup.push(w)
  }
  dedup.sort((a, b) => a.t - b.t)

  // -------------------------------------------------------------------------
  // 2) Word stream -> lines (split on >= 0.6s gap)
  // -------------------------------------------------------------------------
  const lines = []
  let cur = null
  for (let i = 0; i < dedup.length; i++) {
    const w = dedup[i]
    const next = dedup[i + 1]
    if (!cur) cur = { start: w.t, words: [w.word] }
    else cur.words.push(w.word)
    const gap = next ? next.t - w.t : 999
    if (gap >= 0.6 || !next) {
      const wordEnd = next ? Math.min(next.t, w.t + 1.0) : w.t + 0.5
      lines.push({
        start: +cur.start.toFixed(3),
        end: +wordEnd.toFixed(3),
        text: cur.words.join(' '),
      })
      cur = null
    }
  }

  return { lines, segments: groupSegments(lines, minSec, maxSec) }
}

// Group adjacent lines into micro-segments (target minSec~maxSec, prefer
// breaking at long pauses).
function groupSegments(input, minSec, maxSec) {
  const segs = []
  let cur = null
  for (const l of input) {
    if (!cur) {
      cur = { start: l.start, end: l.end, lines: [l] }
      continue
    }
    const gap = l.start - cur.end
    const curDur = cur.end - cur.start
    const shouldBreak =
      curDur >= maxSec ||
      (curDur >= minSec && gap >= 0.5) ||
      (curDur >= minSec * 0.7 && gap >= 1.0)
    if (shouldBreak) {
      segs.push(cur)
      cur = { start: l.start, end: l.end, lines: [l] }
    } else {
      cur.end = l.end
      cur.lines.push(l)
    }
  }
  if (cur) segs.push(cur)
  return segs.map((s, i) => ({
    idx: i + 1,
    start: +s.start.toFixed(2),
    end: +s.end.toFixed(2),
    duration: +(s.end - s.start).toFixed(2),
    sentence_en: s.lines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim(),
    lines: s.lines,
  }))
}
