// =============================================================================
// TrueFalse — Per-segment True/False quiz component.
// Shows a statement and two big buttons for True / False.
//
// Props:
//   statement     string    The claim to judge (e.g. "Creepers are friendly.")
//   correctAnswer boolean   true or false
//   onAnswer      (isCorrect: boolean, choice: string) => void
//   disabled      boolean   Lock interaction
// =============================================================================
import { useState } from 'react'

export default function TrueFalse({ statement, correctAnswer, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null) // true | false | null
  const [flash, setFlash] = useState(null) // 'correct' | 'wrong' | null

  function handlePick(value) {
    if (disabled || picked !== null) return
    const isCorrect = value === correctAnswer
    setPicked(value)
    setFlash(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      onAnswer?.(isCorrect, value ? 'true' : 'false')
    }, 400)
  }

  function btnStyle(value) {
    const isPicked = picked === value
    const isCorrectBtn = value === correctAnswer
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
    } else if (picked !== null && isCorrectBtn) {
      bg = 'rgba(111,186,44,0.08)'
      border = '2px solid var(--color-grass)'
    }
    return {
      flex: 1, padding: '16px 20px', borderRadius: 12,
      border, background: bg, color,
      cursor: disabled || picked !== null ? 'default' : 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700,
      textAlign: 'center',
      transition: 'background 150ms ease, border-color 150ms ease',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p style={{
        margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-title)',
        lineHeight: 1.5, fontStyle: 'italic',
        background: 'var(--color-cream)', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
      }}>
        "{statement}"
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
        Is this statement true or false?
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button
          type="button"
          disabled={disabled || picked !== null}
          onClick={() => handlePick(true)}
          style={btnStyle(true)}
        >
          TRUE
        </button>
        <button
          type="button"
          disabled={disabled || picked !== null}
          onClick={() => handlePick(false)}
          style={btnStyle(false)}
        >
          FALSE
        </button>
      </div>
    </div>
  )
}
