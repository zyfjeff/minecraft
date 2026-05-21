// SpeakAlong — minimal pronunciation practice widget.
//
// Wraps src/lib/speech.js: shows a "Speak it" mic button, captures one
// utterance, scores it against `prompt`, and renders ABCD feedback with a
// per-word hit/miss row. Self-contained — no auth / network calls.

import { useCallback, useState } from 'react'
import { isSpeechRecognitionSupported, recognizeOnce, scoreRecognition } from '../lib/speech'

const GRADE_COLORS = {
  A: '#2E7D32',
  B: '#558B2F',
  C: '#EF6C00',
  D: '#C62828',
}

export default function SpeakAlong({ prompt, label = 'Speak it', compact = false }) {
  const [state, setState] = useState('idle') // idle | listening | scored | error
  const [result, setResult] = useState(null)  // { transcript, score, grade, words }
  const [errorMsg, setErrorMsg] = useState('')
  const supported = isSpeechRecognitionSupported()

  const onSpeak = useCallback(async () => {
    if (!prompt) return
    setState('listening')
    setErrorMsg('')
    setResult(null)
    try {
      const { transcript } = await recognizeOnce({ lang: 'en-US', timeoutMs: 7000 })
      const scored = scoreRecognition(prompt, transcript)
      setResult({ transcript, ...scored })
      setState('scored')
    } catch (err) {
      const code = err?.code || 'unknown'
      const msg = code === 'not-allowed'
        ? 'Microphone permission denied. Allow it to practice speaking.'
        : code === 'no-speech'
          ? 'No speech detected — try again.'
          : code === 'unsupported'
            ? 'Speech recognition is not supported in this browser. Try Chrome or Safari.'
            : `Speech error: ${code}`
      setErrorMsg(msg)
      setState('error')
    }
  }, [prompt])

  if (!supported) {
    return (
      <span style={{ fontSize: 11, color: 'var(--color-muted)' }} title="Try Chrome or Safari">
        🎤 unsupported
      </span>
    )
  }

  const listening = state === 'listening'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      width: compact ? 'auto' : '100%',
    }}>
      <button
        type="button"
        onClick={onSpeak}
        disabled={listening || !prompt}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: compact ? '6px 12px' : '8px 16px',
          borderRadius: 'var(--radius-pill)',
          border: 'none',
          background: listening ? '#C62828' : 'var(--color-diamond)',
          color: '#fff',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: compact ? 12 : 13,
          cursor: listening ? 'not-allowed' : 'pointer',
          alignSelf: compact ? 'flex-start' : 'stretch',
          justifyContent: 'center',
        }}
      >
        {listening ? '● Listening…' : `🎤 ${label}`}
      </button>

      {state === 'error' && (
        <p style={{ fontSize: 11, color: '#C62828', margin: 0 }}>{errorMsg}</p>
      )}

      {state === 'scored' && result && (
        <div style={{
          fontSize: 12, padding: '8px 10px',
          background: 'var(--color-surface-soft)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
              color: GRADE_COLORS[result.grade] || 'var(--color-body)',
            }}>
              {result.grade}
            </span>
            <span style={{ color: 'var(--color-muted)' }}>
              {Math.round(result.score * 100)}%
            </span>
          </div>
          {result.words.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {result.words.map((w, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: w.hit ? 'var(--color-grass-wash)' : '#FFE0E0',
                  color: w.hit ? 'var(--color-emerald)' : '#C62828',
                  fontWeight: 600,
                }}>
                  {w.hit ? '✓' : '✗'} {w.expected}
                </span>
              ))}
            </div>
          )}
          {result.transcript && (
            <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0, fontStyle: 'italic' }}>
              You said: "{result.transcript}"
            </p>
          )}
        </div>
      )}
    </div>
  )
}
