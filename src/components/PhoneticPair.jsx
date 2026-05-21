// =============================================================================
// PhoneticPair — Minimal pair discrimination quiz.
// Plays a segment, then asks "Which word did you hear?" with two similar words.
//
// Props:
//   pair         [string, string]   The two minimal-pair words (e.g. ["ship","sheep"])
//   correctIndex 0 | 1             Which one was actually said
//   onAnswer     (isCorrect: boolean, choice: string) => void
//   disabled     boolean
// =============================================================================
import { useState } from 'react'

export default function PhoneticPair({ pair, correctIndex, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null) // 0 | 1 | null
  const [flash, setFlash] = useState(null)

  function handlePick(idx) {
    if (disabled || picked !== null) return
    const isCorrect = idx === correctIndex
    setPicked(idx)
    setFlash(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => {
      onAnswer?.(isCorrect, pair[idx] || '')
    }, 400)
  }

  function btnStyle(idx) {
    const isPicked = picked === idx
    const isCorrectBtn = idx === correctIndex
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
      flex: 1, padding: '20px', borderRadius: 14,
      border, background: bg, color,
      cursor: disabled || picked !== null ? 'default' : 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700,
      textAlign: 'center', letterSpacing: '0.02em',
      transition: 'background 150ms ease, border-color 150ms ease',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p style={{
        margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-title)',
      }}>
        Which word did you hear?
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
        These words sound similar — listen carefully!
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button
          type="button"
          disabled={disabled || picked !== null}
          onClick={() => handlePick(0)}
          style={btnStyle(0)}
        >
          {pair?.[0] || '?'}
        </button>
        <span style={{
          display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700,
          color: 'var(--color-muted)',
        }}>vs</span>
        <button
          type="button"
          disabled={disabled || picked !== null}
          onClick={() => handlePick(1)}
          style={btnStyle(1)}
        >
          {pair?.[1] || '?'}
        </button>
      </div>
    </div>
  )
}
