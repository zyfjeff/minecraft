// VocabReview — local-first spaced repetition review queue.
//
// Pulls due words from src/lib/srs.js (which seeds from the user's learned
// vocab set) and renders a simple flashcard loop with three rating buttons:
// Again / Good / Easy. After each rating, we advance to the next card.
//
// No course/lesson coupling — pure word-level review. Words that fall out
// of the learned set (e.g. course removed) are filtered out by the lib.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchLearnedVocabWords } from '../lib/courses'
import { listDueWords, recordReview } from '../lib/srs'
import SpeakAlong from '../components/SpeakAlong'

const RATING_BUTTONS = [
  { key: 'again', label: 'Again', color: '#E53935', desc: '< 10 min' },
  { key: 'good',  label: 'Good',  color: 'var(--color-grass)', desc: 'next interval' },
  { key: 'easy',  label: 'Easy',  color: 'var(--color-diamond)', desc: 'longer' },
]

export default function VocabReview() {
  const { authUser, vocabMap, vocabLoaded } = useAuth()
  const navigate = useNavigate()
  const [learnedWords, setLearnedWords] = useState(null) // Set | null
  const [queue, setQueue] = useState([]) // [{ word, state }]
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)

  // Load learned vocab once per user.
  useEffect(() => {
    let cancelled = false
    const uid = authUser?.id
    if (!uid) { setLearnedWords(new Set()); return }
    fetchLearnedVocabWords(uid).then((set) => {
      if (!cancelled) setLearnedWords(set)
    }).catch(() => { if (!cancelled) setLearnedWords(new Set()) })
    return () => { cancelled = true }
  }, [authUser?.id])

  // Build review queue when learned words arrive.
  useEffect(() => {
    if (!learnedWords) return
    const list = listDueWords(authUser?.id, learnedWords, { limit: 30 })
    setQueue(list)
    setIdx(0)
    setRevealed(false)
    setCompletedCount(0)
  }, [learnedWords, authUser?.id])

  const current = queue[idx]
  const wordEntry = useMemo(() => {
    if (!current) return null
    // vocabMap is keyed by id; find by word (lowercased).
    const all = Object.values(vocabMap || {})
    return all.find((w) => (w.word || '').toLowerCase() === current.word) || { word: current.word }
  }, [current, vocabMap])

  const onRate = useCallback((rating) => {
    if (!current) return
    recordReview(authUser?.id, current.word, rating)
    setCompletedCount((c) => c + 1)
    setRevealed(false)
    setIdx((i) => i + 1)
  }, [current, authUser?.id])

  if (!vocabLoaded || !learnedWords) {
    return (
      <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <div className="skeleton-line" style={{ width: 200, height: 20, margin: '0 auto' }} />
      </div>
    )
  }

  const finished = !current
  const total = queue.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg) 0' }}>
      <div style={{ padding: '0 var(--space-md)' }}>
        <button
          type="button"
          onClick={() => navigate('/vocab')}
          style={{
            background: 'none', border: 'none', color: 'var(--color-muted)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', padding: 0,
          }}
        >
          ← Back to Vocab Book
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
          color: 'var(--color-title)', margin: 0,
        }}>
          🔁 Vocab Review
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '4px 0 0' }}>
          {finished
            ? `Done! ${completedCount} word${completedCount === 1 ? '' : 's'} reviewed.`
            : `Card ${idx + 1} of ${total} · ${completedCount} done`}
        </p>
      </div>

      {finished ? (
        <div style={{
          margin: '0 var(--space-md)', padding: 'var(--space-2xl)',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          textAlign: 'center', boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, margin: '0 0 6px' }}>
            All caught up!
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 var(--space-md)' }}>
            {completedCount > 0
              ? 'Come back later — words will be due again on their next interval.'
              : 'No words are due right now. Learn more in courses to fill the queue.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/vocab')}
            style={{
              padding: '10px 22px', borderRadius: 'var(--radius-pill)',
              background: 'var(--color-grass)', color: '#fff', border: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Vocab Book
          </button>
        </div>
      ) : (
        <>
          {/* Card */}
          <div style={{
            margin: '0 var(--space-md)', padding: 'var(--space-2xl) var(--space-lg)',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            minHeight: 240, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
              color: 'var(--color-title)', textAlign: 'center',
            }}>
              {wordEntry?.word || current.word}
            </div>
            {wordEntry?.pos && (
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-surface-soft)', color: 'var(--color-body)',
              }}>
                {wordEntry.pos}
              </span>
            )}
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                style={{
                  marginTop: 12, padding: '10px 24px', borderRadius: 'var(--radius-pill)',
                  border: '2px solid var(--color-grass)', background: 'transparent',
                  color: 'var(--color-grass)', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                Show meaning
              </button>
            ) : (
              <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <p style={{ fontSize: 15, color: 'var(--color-title)', margin: '0 0 6px', lineHeight: 1.5 }}>
                  {wordEntry?.definition_en || '(no definition)'}
                </p>
                {wordEntry?.definition_zh && (
                  <p style={{ fontSize: 13, color: 'var(--color-body)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {wordEntry.definition_zh}
                  </p>
                )}
                {wordEntry?.example_en && (
                  <p style={{
                    fontSize: 13, fontStyle: 'italic',
                    color: 'var(--color-muted)', margin: '10px 0 0',
                  }}>
                    "{wordEntry.example_en}"
                  </p>
                )}
                {/* Pronunciation practice (Web Speech API). Hidden when the
                    browser lacks support; falls back to a tiny info chip. */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                  <SpeakAlong prompt={wordEntry?.word || current.word} label="Speak this word" compact />
                </div>
              </div>
            )}
          </div>

          {/* Rating row */}
          {revealed && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-sm)', padding: '0 var(--space-md)',
            }}>
              {RATING_BUTTONS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onRate(b.key)}
                  style={{
                    padding: '12px 8px', borderRadius: 'var(--radius-md)',
                    background: b.color, color: '#fff', border: 'none',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  <span>{b.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>{b.desc}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
