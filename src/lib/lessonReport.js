// =============================================================================
// lessonReport.js — Single source of truth for post-lesson summary statistics.
//
// All three lesson kinds (Listening / Reading / Vocab) used to maintain their
// own near-identical useMemo block to compute totals, percentage, weak areas
// and per-qtype entries from a `{ [qtype]: { total, correct } }` shape. The
// helpers here normalise that into one canonical schema:
//
//   summarizeReport(scores, qtypeLabels?) -> {
//     totalQ:        number,
//     totalCorrect:  number,
//     pct:           number   // 0..100, rounded
//     qtypeEntries:  Array<{ qtype, label, total, correct, ratio }>,
//     weakAreas:     string[] // human label of qtypes whose ratio < weakRatio
//   }
//
// This module is intentionally pure (no React / no DOM / no supabase) so it is
// trivial to unit-test and re-use from any caller.
// =============================================================================

// Default qtype label map shared by the three lesson kinds. Page-specific
// labels can be passed in via the `labels` argument; missing keys fall back
// to the qtype id itself.
export const DEFAULT_QTYPE_LABELS = {
  // Listening
  cloze: 'Cloze Fill',
  comprehension: 'Comprehension',
  detail_mcq: 'Detail MCQ',
  true_false: 'True / False',
  sound_match: 'Sound Match',
  speaker_intent: 'Speaker Intent',
  phonetic_pair: 'Phonetic Pair',
  // Reading
  vocabulary_cloze: 'Vocabulary Cloze',
  word_match: 'Word Match',
  sentence_order: 'Sentence Order',
  // Vocab
  en2zh: 'English → Chinese',
  zh2en: 'Chinese → English',
  spelling: 'Spelling',
}

/**
 * Build the canonical report summary from a per-qtype score map.
 *
 * @param {Record<string, { total: number, correct: number }>} scores
 * @param {object} [opts]
 * @param {Record<string,string>} [opts.labels]    Override label map.
 * @param {number}                [opts.weakRatio] Threshold below which a qtype
 *                                                 is flagged as weak. Default 0.6.
 * @param {boolean}               [opts.skipEmpty] Drop entries with total==0
 *                                                 from `qtypeEntries`. Default true.
 */
export function summarizeReport(scores, opts = {}) {
  const { labels = DEFAULT_QTYPE_LABELS, weakRatio = 0.6, skipEmpty = true } = opts
  let totalQ = 0
  let totalCorrect = 0
  const qtypeEntries = []
  const weakAreas = []
  const src = scores && typeof scores === 'object' ? scores : {}

  for (const [qtype, raw] of Object.entries(src)) {
    const total = Math.max(0, Number(raw?.total) || 0)
    const correct = Math.max(0, Number(raw?.correct) || 0)
    if (skipEmpty && total === 0) continue
    totalQ += total
    totalCorrect += correct
    const ratio = total > 0 ? correct / total : 0
    qtypeEntries.push({
      qtype,
      label: labels[qtype] || qtype,
      total,
      correct,
      ratio,
    })
    if (total > 0 && ratio < weakRatio) {
      weakAreas.push(labels[qtype] || qtype)
    }
  }

  const pct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0
  return { totalQ, totalCorrect, pct, qtypeEntries, weakAreas }
}

/**
 * Pick a ring colour from a 0..100 score using the project's palette tokens.
 * Centralised so all three reports stay visually consistent.
 */
export function pickScoreRingColor(pct) {
  if (pct >= 80) return 'var(--color-grass)'
  if (pct >= 50) return '#e6a817'
  return 'var(--color-danger, #c13c3c)'
}

/**
 * Format `mm:ss` from seconds. Handles negative / NaN safely.
 */
export function formatMinutesSeconds(timeSpentSec) {
  const total = Math.max(0, Number(timeSpentSec) || 0)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return { minutes, seconds, label: `${minutes}m ${seconds}s` }
}
