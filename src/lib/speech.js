// Web Speech API helpers + lightweight ABCD scoring.
//
// Why a thin wrapper: Chrome / Safari ship the recognition class as
// `webkitSpeechRecognition`; Edge / Firefox have partial / behind-flag
// support. We feature-detect once, normalize the constructor, and expose
// a Promise-based recognize() so callers don't deal with event soup.
//
// Scoring: word-overlap ratio + small bonus for word-order match. Strictly
// client-side; no audio leaves the browser.

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
}

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// Recognize a single utterance. Resolves with `{ transcript, confidence }`
// or rejects with an Error tagged via `.code`:
//   'unsupported' | 'no-speech' | 'aborted' | 'audio-capture' | 'not-allowed' | 'network' | 'unknown'
export function recognizeOnce({ lang = 'en-US', timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      const err = new Error('SpeechRecognition not supported in this browser.')
      err.code = 'unsupported'
      reject(err)
      return
    }
    let settled = false
    const rec = new Ctor()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 3
    rec.continuous = false

    const finish = (fn, val) => {
      if (settled) return
      settled = true
      try { rec.stop() } catch { /* ignore */ }
      fn(val)
    }
    const timer = setTimeout(() => {
      const err = new Error('Speech recognition timed out')
      err.code = 'no-speech'
      finish(reject, err)
    }, timeoutMs)

    rec.onresult = (event) => {
      clearTimeout(timer)
      const results = event.results?.[0]
      if (!results || results.length === 0) {
        const err = new Error('No speech captured')
        err.code = 'no-speech'
        finish(reject, err)
        return
      }
      const best = results[0]
      finish(resolve, { transcript: best.transcript || '', confidence: best.confidence ?? 0 })
    }
    rec.onerror = (event) => {
      clearTimeout(timer)
      const err = new Error(event.error || 'speech-recognition-error')
      err.code = event.error || 'unknown'
      finish(reject, err)
    }
    rec.onend = () => {
      clearTimeout(timer)
      if (!settled) {
        const err = new Error('No result before end')
        err.code = 'no-speech'
        finish(reject, err)
      }
    }
    try {
      rec.start()
    } catch (e) {
      clearTimeout(timer)
      const err = new Error(e.message || 'Failed to start recognition')
      err.code = 'unknown'
      finish(reject, err)
    }
  })
}

// Normalize a phrase for comparison: lowercase, strip punctuation, collapse spaces.
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

// Score a recognition transcript vs the expected phrase. Returns { score, grade, words }.
//
//   score: float 0..1 — recall (expected words found in transcript) blended with
//          a small order bonus. Single-word prompts simplify to exact match.
//   grade: 'A' | 'B' | 'C' | 'D' — derived from score buckets.
//   words: array of { expected, hit } for per-word UI feedback.
export function scoreRecognition(expected, transcript) {
  const expTokens = tokenize(expected)
  const heardTokens = tokenize(transcript)
  if (expTokens.length === 0) return { score: 0, grade: 'D', words: [] }

  const heardSet = new Set(heardTokens)
  let hits = 0
  const words = expTokens.map((w) => {
    const hit = heardSet.has(w)
    if (hit) hits += 1
    return { expected: w, hit }
  })
  const recall = hits / expTokens.length

  // Order bonus: count how many expected words appear in the same relative order.
  let orderHits = 0
  let cursor = 0
  for (const w of expTokens) {
    const idx = heardTokens.indexOf(w, cursor)
    if (idx !== -1) {
      orderHits += 1
      cursor = idx + 1
    }
  }
  const orderRatio = orderHits / expTokens.length

  // Blend: recall is primary; order adds up to +0.15 finesse.
  const score = Math.max(0, Math.min(1, recall * 0.85 + orderRatio * 0.15))

  let grade
  if (score >= 0.9) grade = 'A'
  else if (score >= 0.75) grade = 'B'
  else if (score >= 0.5) grade = 'C'
  else grade = 'D'

  return { score, grade, words }
}
