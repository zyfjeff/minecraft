// Pure-function unit tests for src/lib/lessonReport.js.
// Run with `npm run test`.
import { describe, expect, it } from 'vitest'
import {
  summarizeReport,
  pickScoreRingColor,
  formatMinutesSeconds,
  DEFAULT_QTYPE_LABELS,
} from '../lessonReport'

describe('summarizeReport', () => {
  it('returns zeros for empty / null / undefined input', () => {
    for (const input of [null, undefined, {}, false]) {
      const r = summarizeReport(input)
      expect(r.totalQ).toBe(0)
      expect(r.totalCorrect).toBe(0)
      expect(r.pct).toBe(0)
      expect(r.qtypeEntries).toEqual([])
      expect(r.weakAreas).toEqual([])
    }
  })

  it('skips entries whose total is zero by default', () => {
    const r = summarizeReport({
      cloze: { total: 0, correct: 0 },
      detail_mcq: { total: 4, correct: 3 },
    })
    expect(r.totalQ).toBe(4)
    expect(r.totalCorrect).toBe(3)
    expect(r.qtypeEntries).toHaveLength(1)
    expect(r.qtypeEntries[0].qtype).toBe('detail_mcq')
  })

  it('keeps zero-total entries when skipEmpty=false', () => {
    const r = summarizeReport(
      { cloze: { total: 0, correct: 0 } },
      { skipEmpty: false },
    )
    expect(r.qtypeEntries).toHaveLength(1)
    expect(r.qtypeEntries[0].ratio).toBe(0)
  })

  it('flags qtypes with ratio below the weak threshold', () => {
    const r = summarizeReport({
      cloze: { total: 5, correct: 1 }, // 0.2 — weak
      true_false: { total: 5, correct: 4 }, // 0.8 — strong
      sound_match: { total: 0, correct: 0 }, // skipped
    })
    expect(r.weakAreas).toContain(DEFAULT_QTYPE_LABELS.cloze)
    expect(r.weakAreas).not.toContain(DEFAULT_QTYPE_LABELS.true_false)
  })

  it('respects custom weakRatio threshold', () => {
    const scores = { cloze: { total: 4, correct: 3 } } // 0.75
    expect(summarizeReport(scores, { weakRatio: 0.6 }).weakAreas).toEqual([])
    expect(summarizeReport(scores, { weakRatio: 0.8 }).weakAreas).toEqual([
      DEFAULT_QTYPE_LABELS.cloze,
    ])
  })

  it('uses the supplied label map and falls back to qtype id', () => {
    const r = summarizeReport(
      { unknown_kind: { total: 1, correct: 0 } },
      { labels: {} },
    )
    expect(r.qtypeEntries[0].label).toBe('unknown_kind')
    expect(r.weakAreas).toEqual(['unknown_kind'])
  })

  it('coerces string / negative / NaN values defensively', () => {
    const r = summarizeReport({
      cloze: { total: '4', correct: '3' },
      true_false: { total: -2, correct: NaN },
      detail_mcq: { total: 'abc', correct: 1 },
    })
    expect(r.totalQ).toBe(4)
    expect(r.totalCorrect).toBe(3)
    // negative & NaN totals collapse to 0 and are dropped by skipEmpty
    expect(r.qtypeEntries).toHaveLength(1)
  })

  it('rounds percentage to nearest integer', () => {
    const r = summarizeReport({ cloze: { total: 3, correct: 1 } }) // 33.33%
    expect(r.pct).toBe(33)
  })
})

describe('pickScoreRingColor', () => {
  it('returns green for >= 80', () => {
    expect(pickScoreRingColor(100)).toBe('var(--color-grass)')
    expect(pickScoreRingColor(80)).toBe('var(--color-grass)')
  })
  it('returns amber for 50..79', () => {
    expect(pickScoreRingColor(79)).toBe('#e6a817')
    expect(pickScoreRingColor(50)).toBe('#e6a817')
  })
  it('returns danger for < 50', () => {
    expect(pickScoreRingColor(49)).toBe('var(--color-danger, #c13c3c)')
    expect(pickScoreRingColor(0)).toBe('var(--color-danger, #c13c3c)')
  })
})

describe('formatMinutesSeconds', () => {
  it('splits seconds into mm + ss', () => {
    expect(formatMinutesSeconds(125)).toEqual({ minutes: 2, seconds: 5, label: '2m 5s' })
  })
  it('clamps invalid input to zero', () => {
    expect(formatMinutesSeconds(-10).label).toBe('0m 0s')
    expect(formatMinutesSeconds(NaN).label).toBe('0m 0s')
    expect(formatMinutesSeconds(undefined).label).toBe('0m 0s')
  })
})
