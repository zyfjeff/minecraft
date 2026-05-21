// =============================================================================
// SoundMatch — Per-segment sound identification quiz.
// Shows a prompt and 4 icon+label cards. The learner picks the sound they heard.
//
// Props:
//   prompt       string                    Question text
//   options      [{label: string, icon: string}]  4 choices with emoji icons
//   correctIndex number                    0-based index of correct option
//   onAnswer     (isCorrect: boolean, choice: string) => void
//   disabled     boolean
// =============================================================================
import { useState } from 'react'

export default function SoundMatch({ prompt, options, correctIndex, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null)
  const [flash, setFlash] = useState(null)

  function handlePick(idx) {
    if (disabled || picked !== null) return
    const isCorrect = idx === correctIndex
    setPicked(idx)
    setFlash(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      onAnswer?.(isCorrect, options[idx]?.label || '')
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
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-sm)',
      }}>
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
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '16px 12px', borderRadius: 12,
                border, background: bg, color,
                cursor: disabled || picked !== null ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
            >
              <span style={{ fontSize: 32 }}>{opt.icon || '?'}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
