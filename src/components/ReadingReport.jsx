// =============================================================================
// ReadingReport — Post-lesson feedback card for segmented reading lessons.
//
// Props:
//   scores        { [qtype]: { total, correct } }  Per-type breakdown
//   heartsLeft    number
//   timeSpentSec  number
//   xpAwarded     number
//   lessonTitle   string
//   weakWords     string[]  — words the reader struggled with
// =============================================================================
import { useMemo } from 'react'
import {
  summarizeReport,
  pickScoreRingColor,
  formatMinutesSeconds,
  DEFAULT_QTYPE_LABELS,
} from '../lib/lessonReport'

const QTYPE_LABELS = {
  vocabulary_cloze: DEFAULT_QTYPE_LABELS.vocabulary_cloze,
  cloze: DEFAULT_QTYPE_LABELS.cloze,
  comprehension: DEFAULT_QTYPE_LABELS.comprehension,
  detail_mcq: DEFAULT_QTYPE_LABELS.detail_mcq,
  true_false: DEFAULT_QTYPE_LABELS.true_false,
  word_match: DEFAULT_QTYPE_LABELS.word_match,
  sentence_order: DEFAULT_QTYPE_LABELS.sentence_order,
}

export default function ReadingReport({ scores, heartsLeft, timeSpentSec, xpAwarded, lessonTitle, weakWords }) {
  const { totalQ, totalCorrect, pct, weakAreas, qtypeEntries } = useMemo(
    () => summarizeReport(scores, { labels: QTYPE_LABELS }),
    [scores]
  )

  const { minutes, seconds } = formatMinutesSeconds(timeSpentSec)

  const ringColor = pickScoreRingColor(pct)

  return (
    <section style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)', marginTop: 'var(--space-lg)',
      textAlign: 'center',
    }}>
      {/* Header */}
      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-title)' }}>
        Reading Report
      </h3>
      {lessonTitle ? (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
          {lessonTitle}
        </p>
      ) : null}

      {/* Score ring */}
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        border: `8px solid ${ringColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', margin: 'var(--space-lg) auto',
        boxShadow: `0 0 0 4px ${ringColor}22`,
      }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: ringColor }}>{pct}%</span>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{totalCorrect}/{totalQ}</span>
      </div>

      {/* Per-type breakdown */}
      {qtypeEntries.length > 0 ? (
        <div style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: 13, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Score Breakdown
          </h4>
          {qtypeEntries.map(({ qtype, total, correct, ratio }) => (
            <div key={qtype} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-title)' }}>
                  {QTYPE_LABELS[qtype] || qtype}
                </span>
                <span style={{ color: 'var(--color-muted)' }}>{correct}/{total}</span>
              </div>
              <div style={{
                height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${Math.round(ratio * 100)}%`,
                  background: ratio >= 0.6 ? 'var(--color-grass)' : 'var(--color-danger, #c13c3c)',
                  transition: 'width 400ms ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Weak areas */}
      {weakAreas.length > 0 ? (
        <div style={{
          background: 'rgba(193,60,60,0.06)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)', marginBottom: 'var(--space-md)', textAlign: 'left',
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-danger, #c13c3c)' }}>
            Needs practice:
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-title)' }}>
            {weakAreas.join(', ')}
          </p>
        </div>
      ) : null}

      {/* Weak vocabulary */}
      {(weakWords || []).length > 0 ? (
        <div style={{
          background: 'rgba(244,180,0,0.06)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)', marginBottom: 'var(--space-md)', textAlign: 'left',
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#a08520' }}>
            Review these words:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            {weakWords.map(w => (
              <span key={w} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                background: 'rgba(244,180,0,0.1)', fontSize: 12, fontWeight: 600,
                color: '#6b5a1e',
              }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Stats row */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)',
        padding: 'var(--space-md) 0', borderTop: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-title)' }}>
            {heartsLeft ?? 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Hearts Left</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-title)' }}>
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Time</div>
        </div>
        {xpAwarded > 0 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-grass)' }}>
              +{xpAwarded}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>XP</div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
