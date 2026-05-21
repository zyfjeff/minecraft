// =============================================================================
// VocabCard — 3D flip flashcard for vocabulary learning phase.
//
// Props:
//   entry       object   — vocab row { word, pos, definition_en, definition_zh,
//                           example_en, example_zh, pixel_icon }
//   index       number   — current card index (0-based)
//   total       number   — total cards in deck
//   onGotIt     ()=>void — user marks word as mastered
//   onLearning  ()=>void — user marks word as still learning
// =============================================================================
import { useState, useCallback } from 'react'

const POS_COLORS = {
  noun: { bg: '#E3F2FD', color: '#1565C0' },
  verb: { bg: '#FFF3E0', color: '#E65100' },
  adj: { bg: '#F3E5F5', color: '#7B1FA2' },
  adv: { bg: '#E8F5E9', color: '#2E7D32' },
  prep: { bg: '#FBE9E7', color: '#BF360C' },
  phrase: { bg: '#E0F7FA', color: '#00695C' },
}

export default function VocabCard({ entry, index, total, onGotIt, onLearning }) {
  const [flipped, setFlipped] = useState(false)

  const handleFlip = useCallback(() => {
    setFlipped(f => !f)
  }, [])

  // Reset flip when card changes
  const [prevWord, setPrevWord] = useState(entry?.word)
  if (entry?.word !== prevWord) {
    setPrevWord(entry?.word)
    if (flipped) setFlipped(false)
  }

  if (!entry) return null

  const posStyle = POS_COLORS[entry.pos] || { bg: 'var(--color-surface-soft)', color: 'var(--color-muted)' }

  return (
    <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
      {/* Progress indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        marginBottom: 'var(--space-md)', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          {index + 1} / {total}
        </span>
        <div style={{
          flex: 1, maxWidth: 160, height: 4, borderRadius: 2,
          background: 'rgba(0,0,0,0.06)',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.round(((index + 1) / total) * 100)}%`,
            background: 'var(--color-grass)',
            transition: 'width 300ms ease',
          }} />
        </div>
      </div>

      {/* Card container with perspective */}
      <div
        onClick={handleFlip}
        style={{
          perspective: 800,
          cursor: 'pointer',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: 420,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-xl)',
            border: '3px solid var(--tile-yellow)',
          }}>
            {/* Pixel icon placeholder */}
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-md)',
              background: 'var(--tile-yellow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-lg)',
              fontSize: 32,
              imageRendering: 'pixelated',
            }}>
              {entry.pixel_icon === 'sword' ? '⚔️' :
               entry.pixel_icon === 'enchant' ? '✨' :
               entry.pixel_icon === 'mob' ? '🧟' :
               entry.pixel_icon === 'blocks' ? '🧱' :
               '📖'}
            </div>

            {/* Word */}
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--color-title)',
              margin: '0 0 var(--space-sm)',
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}>
              {entry.word}
            </h2>

            {/* POS badge */}
            {entry.pos ? (
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: posStyle.color,
                background: posStyle.bg,
                padding: '3px 12px',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'lowercase',
                letterSpacing: '0.04em',
              }}>
                {entry.pos}
              </span>
            ) : null}

            {/* Tap hint */}
            <p style={{
              margin: 'var(--space-lg) 0 0',
              fontSize: 12,
              color: 'var(--color-muted)',
              opacity: 0.6,
            }}>
              Tap to reveal meaning
            </p>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
            padding: 'var(--space-lg)',
            border: '3px solid var(--color-grass)',
            overflow: 'auto',
            gap: 'var(--space-sm)',
          }}>
            {/* Word header + Chinese meaning */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginBottom: 2 }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: 'var(--color-title)', margin: 0,
              }}>
                {entry.word}
              </h3>
              {entry.pos ? (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: posStyle.color, background: posStyle.bg,
                  padding: '2px 6px', borderRadius: 'var(--radius-pill)',
                }}>
                  {entry.pos}
                </span>
              ) : null}
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-grass-active, #2E7D32)', marginLeft: 'auto' }}>
                {entry.definition_zh || ''}
              </span>
            </div>

            {/* Synonyms */}
            {entry.synonyms?.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Also:
                </span>
                {entry.synonyms.map(s => (
                  <span key={s} style={{
                    fontSize: 12, fontWeight: 600,
                    color: '#6b5a1e', background: 'rgba(244,180,0,0.1)',
                    padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            ) : null}

            {/* English definition */}
            <div style={{
              background: 'rgba(33,150,243,0.05)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              borderLeft: '3px solid var(--tile-blue, #42A5F5)',
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--tile-blue, #1976D2)', marginBottom: 2 }}>
                Meaning
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-title)', lineHeight: 1.4 }}>
                {entry.definition_en || '—'}
              </p>
            </div>

            {/* Minecraft Role */}
            {entry.minecraft_role ? (
              <div style={{
                background: 'rgba(76,175,80,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                borderLeft: '3px solid var(--color-grass)',
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-grass-active, #2E7D32)', marginBottom: 2 }}>
                  In Minecraft
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-title)', lineHeight: 1.4 }}>
                  {entry.minecraft_role}
                </p>
              </div>
            ) : null}

            {/* How to Obtain / Craft */}
            {entry.minecraft_obtain ? (
              <div style={{
                background: 'rgba(244,180,0,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                borderLeft: '3px solid var(--tile-yellow)',
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8B6914', marginBottom: 2 }}>
                  How to Get
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-title)', lineHeight: 1.4 }}>
                  {entry.minecraft_obtain}
                </p>
              </div>
            ) : null}

            {/* Example sentence */}
            {entry.example_en ? (
              <div style={{
                background: 'var(--color-surface-soft, rgba(0,0,0,0.02))',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                borderLeft: '3px solid rgba(0,0,0,0.1)',
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 2 }}>
                  Example
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-title)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{entry.example_en}"
                </p>
                {entry.example_zh ? (
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>
                    {entry.example_zh}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: 'var(--space-md)',
        justifyContent: 'center',
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onLearning?.() }}
          style={{
            flex: 1, maxWidth: 160, padding: '12px 0',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-danger, #c13c3c)',
            background: 'rgba(193,60,60,0.06)',
            color: 'var(--color-danger, #c13c3c)',
            fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Still Learning
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onGotIt?.() }}
          style={{
            flex: 1, maxWidth: 160, padding: '12px 0',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-grass)',
            background: 'rgba(76,175,80,0.08)',
            color: 'var(--color-grass-active, #2E7D32)',
            fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Got It!
        </button>
      </div>
    </div>
  )
}
