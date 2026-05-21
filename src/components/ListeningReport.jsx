// =============================================================================
// ListeningReport — Post-lesson feedback card shown after all cooldown drills.
// Displays total score, per-qtype breakdown, weak areas, time, and hearts left.
//
// Props:
//   scores        { [qtype]: { total, correct } }  Per-type breakdown
//   heartsLeft    number
//   timeSpentSec  number
//   xpAwarded     number
//   lessonTitle   string
// =============================================================================
import { useMemo } from 'react'
import {
  summarizeReport,
  pickScoreRingColor,
  formatMinutesSeconds,
  DEFAULT_QTYPE_LABELS,
} from '../lib/lessonReport'

// Listening uses a small subset of the global qtype label map.
const QTYPE_LABELS = {
  cloze: DEFAULT_QTYPE_LABELS.cloze,
  comprehension: DEFAULT_QTYPE_LABELS.comprehension,
  detail_mcq: DEFAULT_QTYPE_LABELS.detail_mcq,
  true_false: DEFAULT_QTYPE_LABELS.true_false,
  sound_match: DEFAULT_QTYPE_LABELS.sound_match,
  speaker_intent: DEFAULT_QTYPE_LABELS.speaker_intent,
  phonetic_pair: DEFAULT_QTYPE_LABELS.phonetic_pair,
}

export default function ListeningReport({ scores, heartsLeft, timeSpentSec, xpAwarded, lessonTitle }) {
  const { totalQ, totalCorrect, pct, weakAreas, qtypeEntries } = useMemo(
    () => summarizeReport(scores, { labels: QTYPE_LABELS }),
    [scores]
  )

  const { minutes, seconds } = formatMinutesSeconds(timeSpentSec)

  // Ring gradient color based on score
  const ringColor = pickScoreRingColor(pct)

  return (
    <section style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)', marginTop: 'var(--space-lg)',
      textAlign: 'center',
    }}>
      {/* Header */}
      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-title)' }}>
        Listening Report
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
          <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: 13, color: 'var(--color-muted)' }}>
            SCORE BREAKDOWN
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
