// =============================================================================
// SequenceReorder — Cooldown drill #1
// Show all segment sentences shuffled. The user must pick them in playback
// order. Picking wrong costs a heart (delegated up to the parent) and resets
// the row so the kid can retry without restarting the whole lesson.
//
// Props:
//   segments    [{ index, text }]  required — original order is the answer key
//   onComplete  ()=>void           required — called once after a perfect run
//   onLoseHeart ()=>void           optional — called on every wrong pick
//   disabled    boolean            optional — lock interaction (e.g. heartsZero)
// =============================================================================
import { useEffect, useMemo, useState } from 'react'

function shuffle(arr, seed = 1) {
  // Deterministic Fisher-Yates so two re-renders show the same order until
  // we explicitly reshuffle (e.g. after a wrong pick).
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280
    const r = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[r]] = [a[r], a[i]]
  }
  return a
}

export default function SequenceReorder({
  segments,
  onComplete,
  onLoseHeart,
  disabled = false,
  ...qoderProps
}) {
  const total = segments?.length || 0
  const [pickedIdx, setPickedIdx] = useState([]) // array of original `index`
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Math.random() * 99999) + 1)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [done, setDone] = useState(false)

  const shuffled = useMemo(
    () => shuffle(segments || [], shuffleSeed),
    [segments, shuffleSeed],
  )

  // Fire onComplete once when the picks form the full correct order.
  useEffect(() => {
    if (done) return
    if (pickedIdx.length !== total || total === 0) return
    const correct = pickedIdx.every((idx, i) => idx === i)
    if (correct) {
      setDone(true)
      onComplete?.()
    }
  }, [pickedIdx, total, done, onComplete])

  function handlePick(seg) {
    if (disabled || done) return
    if (pickedIdx.includes(seg.index)) return
    const nextSlot = pickedIdx.length // 0-based slot index = expected seg.index
    if (seg.index === nextSlot) {
      setPickedIdx((prev) => [...prev, seg.index])
    } else {
      // Wrong pick — flash, lose heart, reset picks, reshuffle the row.
      setWrongFlash(true)
      onLoseHeart?.()
      setTimeout(() => setWrongFlash(false), 350)
      setPickedIdx([])
      setShuffleSeed((s) => (s + 1) % 99999 || 1)
    }
  }

  function pickedRank(seg) {
    const slot = pickedIdx.indexOf(seg.index)
    return slot === -1 ? null : slot + 1
  }

  return (
    <section
      data-component="cooldown-sequence"
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
     data-qoder-id="qel-cooldown-sequence-e6ea5c14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cooldown-sequence-e6ea5c14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;cooldown-sequence&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:5}}" className={qoderProps?.className}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', letterSpacing: 1 }} data-qoder-id="qel-p-08b7c3e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-08b7c3e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:91,&quot;column&quot;:7}}">
        COOLDOWN · DRILL 1 / 3
      </p>
      <h3 style={{ margin: '4px 0 4px', fontSize: 18, color: 'var(--color-title)' }} data-qoder-id="qel-h3-2512723e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-2512723e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:7}}">
        Put the sentences back in order
      </h3>
      <p style={{ margin: '0 0 var(--space-md)', fontSize: 13, color: 'var(--color-muted)' }} data-qoder-id="qel-p-06b7c0c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-06b7c0c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:7}}">
        Tap each line in the order you heard them. Wrong tap costs a heart.
      </p>

      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
       data-qoder-id="qel-ol-0f07a200" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ol-0f07a200&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;ol&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:7}}">
        {shuffled.map((seg) => {
          const rank = pickedRank(seg)
          const isPicked = rank !== null
          return (
            <li key={seg.index} data-qoder-id="qel-li-cf96cd41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-cf96cd41&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:13}}">
              <button
                type="button"
                disabled={disabled || isPicked || done}
                onClick={() => handlePick(seg)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: isPicked
                    ? '2px solid var(--color-grass)'
                    : '2px solid var(--color-border, rgba(0,0,0,0.08))',
                  background: isPicked ? 'rgba(111,186,44,0.12)' : 'white',
                  color: 'var(--color-title)',
                  cursor: disabled || isPicked || done ? 'default' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  lineHeight: 1.45,
                }}
               data-qoder-id="qel-button-c2c139fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-c2c139fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:116,&quot;column&quot;:15}}">
                <span
                  aria-hidden="true"
                  style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: 6,
                    background: isPicked ? 'var(--color-grass)' : 'rgba(0,0,0,0.08)',
                    color: isPicked ? 'white' : 'var(--color-muted)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                 data-qoder-id="qel-span-62421a6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-62421a6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:17}}">
                  {isPicked ? `#${rank}` : '·'}
                </span>
                <span style={{ flex: 1 }} data-qoder-id="qel-span-614218da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-614218da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:156,&quot;column&quot;:17}}">{seg.text}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {done ? (
        <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--color-grass)', fontWeight: 600 }} data-qoder-id="qel-p-964b937e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-964b937e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SequenceReorder.jsx&quot;,&quot;componentName&quot;:&quot;SequenceReorder&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:9}}">
          ✓ Perfect order!
        </p>
      ) : null}
    </section>
  )
}
