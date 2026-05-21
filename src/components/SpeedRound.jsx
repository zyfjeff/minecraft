// =============================================================================
// SpeedRound — Cooldown drill #2
// 30-second pixel-arcade-style sprint. We re-show every segment's blank as a
// 4-option cloze and the kid races the timer. Wrong picks cost a heart.
// Finishing all blanks before time-out is a "perfect clear"; otherwise the
// component still calls onComplete with a summary so the parent can decide
// whether to advance to the next cooldown drill.
//
// Props:
//   items       [{ key, sentence, blank, options }]  required
//                 sentence must contain the literal token "____" placeholder.
//   onComplete  ({correct, total, timedOut})=>void    required
//   onLoseHeart ()=>void                              optional
//   disabled    boolean                                optional
//   durationSec number  (default 30)
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react'

export default function SpeedRound({
  items,
  onComplete,
  onLoseHeart,
  disabled = false,
  durationSec = 30,
  ...qoderProps
}) {
  const total = items?.length || 0
  const [idx, setIdx] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [secLeft, setSecLeft] = useState(durationSec)
  const [done, setDone] = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [lastPick, setLastPick] = useState(null) // {choice, ok}
  const completedRef = useRef(false)

  const current = items?.[idx] || null

  // Start countdown only after mount; tick every 1000ms.
  useEffect(() => {
    if (disabled || done) return undefined
    const id = setInterval(() => {
      setSecLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [disabled, done])

  // Time-out → finalise.
  useEffect(() => {
    if (done) return
    if (secLeft <= 0) {
      setDone(true)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.({ correct: correctCount, total, timedOut: true })
      }
    }
  }, [secLeft, done, correctCount, total, onComplete])

  // All items answered → finalise.
  useEffect(() => {
    if (done) return
    if (total > 0 && idx >= total) {
      setDone(true)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.({ correct: correctCount, total, timedOut: false })
      }
    }
  }, [idx, total, done, correctCount, onComplete])

  function handlePick(choice) {
    if (disabled || done || !current) return
    const ok = choice === current.blank
    setLastPick({ choice, ok })
    if (ok) {
      setCorrectCount((c) => c + 1)
      // Brief tick before advancing so the user sees the green flash.
      setTimeout(() => {
        setIdx((i) => i + 1)
        setLastPick(null)
      }, 200)
    } else {
      onLoseHeart?.()
      setWrongFlash(true)
      setTimeout(() => {
        setWrongFlash(false)
        setLastPick(null)
        // Skip to the next item even on wrong (keep the speed pressure on).
        setIdx((i) => i + 1)
      }, 350)
    }
  }

  function renderSentence(sent, blank, ok) {
    if (!sent) return null
    const parts = sent.split('____')
    return (
      <p style={{ fontSize: 18, color: 'var(--color-title)', margin: 0, lineHeight: 1.5 }} data-qoder-id="qel-p-0863a94e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-0863a94e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:7}}">
        {parts[0]}
        <span
          style={{
            display: 'inline-block',
            minWidth: 60,
            padding: '0 6px',
            borderBottom: ok === true
              ? '3px solid var(--color-grass)'
              : ok === false
                ? '3px solid var(--color-danger, #c13c3c)'
                : '3px solid rgba(0,0,0,0.25)',
            color: ok === true ? 'var(--color-grass)' : 'inherit',
            fontWeight: 700,
            textAlign: 'center',
          }}
         data-qoder-id="qel-span-45db6b63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-45db6b63&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:9}}">
          {ok === true ? blank : '____'}
        </span>
        {parts[1] || ''}
      </p>
    )
  }

  const pct = useMemo(() => {
    if (durationSec <= 0) return 0
    return Math.max(0, Math.min(100, (secLeft / durationSec) * 100))
  }, [secLeft, durationSec])

  return (
    <section
      data-component="cooldown-speed"
      style={{ ...({
        background: 'var(--color-card)',
        borderRadius: 12,
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-lg)',
        boxShadow: wrongFlash
          ? '0 0 0 3px var(--color-danger, #c13c3c) inset'
          : 'var(--shadow-card)',
        transition: 'box-shadow 250ms ease',
      }), ...(qoderProps?.style) }}
     data-qoder-id="qel-cooldown-speed-895120a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cooldown-speed-895120a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;cooldown-speed&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:5}}" className={qoderProps?.className}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }} data-qoder-id="qel-div-e737c399" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e737c399&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:7}}">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', letterSpacing: 1 }} data-qoder-id="qel-p-0c63af9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-0c63af9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:141,&quot;column&quot;:9}}">
          COOLDOWN · DRILL 2 / 3 · SPEED ROUND
        </p>
        <span
          aria-live="polite"
          style={{
            fontFamily: 'var(--font-pixel, var(--font-body))',
            fontSize: 18,
            fontWeight: 700,
            color: secLeft <= 5 ? 'var(--color-danger, #c13c3c)' : 'var(--color-title)',
          }}
         data-qoder-id="qel-span-49db71af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-49db71af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:9}}">
          {String(secLeft).padStart(2, '0')}s
        </span>
      </div>

      {/* Pixel timer bar */}
      <div
        style={{
          marginTop: 8,
          height: 8,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
       data-qoder-id="qel-div-e437bee0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e437bee0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:158,&quot;column&quot;:7}}">
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: secLeft <= 5 ? 'var(--color-danger, #c13c3c)' : 'var(--color-grass)',
            transition: 'width 1s linear',
          }}
         data-qoder-id="qel-div-f337d67d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f337d67d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:167,&quot;column&quot;:9}}"/>
      </div>

      {!done && current ? (
        <>
          <h3 style={{ margin: '12px 0 4px', fontSize: 16, color: 'var(--color-title)' }} data-qoder-id="qel-h3-b5e9a774" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-b5e9a774&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:11}}">
            {idx + 1} / {total} — fill the blank fast
          </h3>
          {renderSentence(current.sentence, current.blank, lastPick?.ok)}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
              marginTop: 'var(--space-md)',
            }}
           data-qoder-id="qel-div-17d07246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-17d07246&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:11}}">
            {(current.options || []).map((opt) => {
              const isThisPick = lastPick?.choice === opt
              const showOk = isThisPick && lastPick.ok
              const showBad = isThisPick && lastPick.ok === false
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled || done || !!lastPick}
                  onClick={() => handlePick(opt)}
                  style={{
                    flex: '1 1 130px',
                    padding: '12px 14px',
                    borderRadius: 999,
                    border: showOk
                      ? '2px solid var(--color-grass)'
                      : showBad
                        ? '2px solid var(--color-danger, #c13c3c)'
                        : '2px solid var(--color-grass)',
                    background: showOk
                      ? 'var(--color-grass)'
                      : showBad
                        ? 'rgba(193,60,60,0.12)'
                        : 'white',
                    color: showOk ? 'white' : 'var(--color-grass)',
                    cursor: disabled || done || lastPick ? 'default' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                 data-qoder-id="qel-button-2637b951" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2637b951&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:17}}">
                  {opt}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-grass)', fontWeight: 600 }} data-qoder-id="qel-p-b0e3ce34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-b0e3ce34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SpeedRound.jsx&quot;,&quot;componentName&quot;:&quot;SpeedRound&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:9}}">
          ⏱ Speed round done — {correctCount} / {total} correct.
        </p>
      )}
    </section>
  )
}
