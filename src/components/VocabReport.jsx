// =============================================================================
// VocabReport — Post-practice feedback card for vocabulary lessons.
//
// Props:
//   totalWords     number
//   masteredCount  number  — words marked "Got it" in learn phase
//   quizResults    { en2zh: {total,correct}, zh2en: {total,correct}, spelling: {total,correct} }
//   wrongWordIds   string[]  — word IDs answered incorrectly in quiz
//   words          object[]  — full vocab entries (for displaying review list)
//   heartsLeft     number
//   timeSpentSec   number
//   xpAwarded      number
//   lessonTitle    string
// =============================================================================
import { useMemo } from 'react'
import {
  summarizeReport,
  pickScoreRingColor,
  formatMinutesSeconds,
  DEFAULT_QTYPE_LABELS,
} from '../lib/lessonReport'

const QTYPE_LABELS = {
  en2zh: DEFAULT_QTYPE_LABELS.en2zh,
  zh2en: DEFAULT_QTYPE_LABELS.zh2en,
  spelling: DEFAULT_QTYPE_LABELS.spelling,
}

export default function VocabReport({
  totalWords, masteredCount, quizResults, wrongWordIds,
  words, heartsLeft, timeSpentSec, xpAwarded, lessonTitle,
}) {
  const { totalQ, totalCorrect, pct, weakAreas, qtypeEntries } = useMemo(
    () => summarizeReport(quizResults, { labels: QTYPE_LABELS }),
    [quizResults]
  )

  const reviewWords = useMemo(() => {
    if (!wrongWordIds?.length || !words?.length) return []
    const ids = new Set(wrongWordIds)
    return words.filter(w => ids.has(w.id))
  }, [wrongWordIds, words])

  const { minutes, seconds } = formatMinutesSeconds(timeSpentSec)

  const ringColor = pickScoreRingColor(pct)

  return (
    <section style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-xl)', marginTop: 'var(--space-lg)',
      textAlign: 'center',
    }}>
      {/* Header */}
      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-title)', fontFamily: 'var(--font-display)' }}>
        Vocabulary Report
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

      {/* Cards mastered summary */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)',
        marginBottom: 'var(--space-lg)',
        padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
        background: 'rgba(76,175,80,0.04)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-grass-active)' }}>
            {masteredCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Mastered</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--tile-yellow)' }}>
            {totalWords - masteredCount}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Learning</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-title)' }}>
            {totalWords}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Total</div>
        </div>
      </div>

      {/* Per-type breakdown */}
      {qtypeEntries.length > 0 ? (
        <div style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: 13, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quiz Breakdown
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

      {/* Review words */}
      {reviewWords.length > 0 ? (
        <div style={{
          background: 'rgba(244,180,0,0.06)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)', marginBottom: 'var(--space-md)', textAlign: 'left',
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#a08520' }}>
            Review these words:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            {reviewWords.map(w => (
              <div key={w.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(244,180,0,0.08)',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-title)' }}>
                  {w.word}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {w.definition_zh}
                </span>
              </div>
            ))}
          </div>
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
            {'❤️'.repeat(heartsLeft ?? 0)}{'🖤'.repeat(Math.max(0, 3 - (heartsLeft ?? 0)))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Hearts</div>
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
