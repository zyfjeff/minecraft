// =============================================================================
// SegmentMCQ — Generic per-segment MCQ quiz component.
// Covers comprehension, detail_mcq, and speaker_intent question types since
// they all share the same prompt + 4-option UI pattern.
//
// Props:
//   prompt       string      The question text (e.g. "What is this segment about?")
//   options      string[]    4 answer choices
//   correctIndex number      0-based index of the correct option
//   onAnswer     (isCorrect: boolean, choice: string) => void
//   disabled     boolean     Lock interaction (e.g. heartsZero)
// =============================================================================
import { useState } from 'react'

export default function SegmentMCQ({ prompt, options, correctIndex, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null) // index
  const [flash, setFlash] = useState(null) // 'correct' | 'wrong' | null

  function handlePick(idx) {
    if (disabled || picked !== null) return
    const isCorrect = idx === correctIndex
    setPicked(idx)
    setFlash(isCorrect ? 'correct' : 'wrong')
    // Brief delay so user sees the visual feedback before parent advances state.
    setTimeout(() => {
      onAnswer?.(isCorrect, options[idx])
    }, 400)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p style={{
        margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-title)',
        lineHeight: 1.5,
      }}>
        {prompt}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {(options || []).map((opt, i) => {
          const isPicked = picked === i
          const isCorrectOpt = i === correctIndex
          let bg = 'white'
          let border = '2px solid var(--color-border, rgba(0,0,0,0.12))'
          let color = 'var(--color-title)'
          if (isPicked && flash === 'correct') {
            bg = 'rgba(111,186,44,0.15)'
            border = '2px solid var(--color-grass)'
            color = 'var(--color-grass)'
          } else if (isPicked && flash === 'wrong') {
            bg = 'rgba(193,60,60,0.1)'
            border = '2px solid var(--color-danger, #c13c3c)'
            color = 'var(--color-danger, #c13c3c)'
          } else if (picked !== null && isCorrectOpt) {
            // Show correct answer when user picked wrong
            bg = 'rgba(111,186,44,0.08)'
            border = '2px solid var(--color-grass)'
          }
          return (
            <button
              key={i}
              type="button"
              disabled={disabled || picked !== null}
              onClick={() => handlePick(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                width: '100%', textAlign: 'left',
                padding: '12px 16px', borderRadius: 10,
                border, background: bg, color,
                cursor: disabled || picked !== null ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isPicked ? (flash === 'correct' ? 'var(--color-grass)' : 'var(--color-danger, #c13c3c)') : 'rgba(0,0,0,0.06)',
                color: isPicked ? 'white' : 'var(--color-muted)',
                fontSize: 12, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
