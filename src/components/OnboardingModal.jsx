// =============================================================================
// OnboardingModal — Lightweight 3-step "first login" flow.
//
// Step 1: Pick a difficulty (beginner / intermediate / advanced).
// Step 2: Show a recommended course (deterministically chosen from the public
//         catalog filtered by difficulty + listening kind) with a CTA that
//         routes the user straight into Listening Studio.
// Step 3: Confetti + "You're ready!" celebration; closing the modal flips
//         localStorage('onboarding_done') so it never re-appears.
//
// Persistence model is intentionally client-only ([P2/S] scope). If we need a
// cross-device flag later, move the boolean to profile.onboarding_done in
// supabase. Until then, clearing browser storage is the only "redo" path —
// acceptable trade-off for the size budget.
// =============================================================================
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'onboarding_done'
const PREFERRED_DIFFICULTY_KEY = 'preferred_difficulty'

export function isOnboardingDone() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage?.getItem(STORAGE_KEY) === 'true'
  } catch {
    return true
  }
}

function persistDone() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, 'true')
  } catch {
    /* private mode — modal will reappear next session, not the end of the world */
  }
}

function persistDifficulty(value) {
  try {
    window.localStorage?.setItem(PREFERRED_DIFFICULTY_KEY, value)
  } catch {
    /* same fallback policy */
  }
}

const DIFFICULTY_OPTIONS = [
  {
    id: 'beginner',
    label: 'Beginner',
    desc: 'New to English — simple vocab, slow pace.',
    emoji: '\u{1F331}', // seedling
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    desc: 'Some experience — comfortable with basic dialogue.',
    emoji: '\u{1F333}', // tree
  },
  {
    id: 'advanced',
    label: 'Advanced',
    desc: 'Fluent — looking to refine vocabulary & speed.',
    emoji: '\u{1F396}\uFE0F', // medal
  },
]

// Pick one course matching the chosen difficulty. Prefers listening kind so
// the new user lands in the studio (videos + quiz, the richest first-touch).
// Falls back gracefully when nothing matches.
function pickRecommendedCourse(courses, difficulty) {
  if (!Array.isArray(courses) || courses.length === 0) return null
  const isListening = (c) => !c.kind || c.kind === 'listening'
  const matchesDiff = (c) => {
    if (!c.difficulty) return true
    return String(c.difficulty).toLowerCase() === difficulty
  }
  const candidates = courses.filter((c) => isListening(c) && matchesDiff(c))
  if (candidates.length > 0) return candidates[0]
  // Fallback A: any listening course.
  const anyListening = courses.find(isListening)
  if (anyListening) return anyListening
  // Fallback B: literally anything.
  return courses[0]
}

export default function OnboardingModal({ courses, onClose }) {
  const [step, setStep] = useState(1)
  const [difficulty, setDifficulty] = useState('beginner')
  const navigate = useNavigate()

  const recommended = useMemo(
    () => pickRecommendedCourse(courses, difficulty),
    [courses, difficulty],
  )

  const handleClose = () => {
    persistDone()
    onClose?.()
  }

  const handleStartCourse = () => {
    persistDone()
    onClose?.()
    if (recommended?.id) {
      // Land on the course detail page so the learner can see the lesson list
      // before diving into a studio.
      navigate(`/course/${recommended.id}`)
    } else {
      navigate('/courses')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
    >
      <div style={{
        background: 'var(--color-cream)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card-hover)',
        width: '100%', maxWidth: 480,
        padding: 'var(--space-xl)',
        position: 'relative',
      }}>
        {/* Step indicator */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          marginBottom: 'var(--space-md)',
        }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i <= step ? 'var(--color-grass)' : 'var(--color-disabled)',
                transition: 'all var(--motion-base) var(--motion-ease)',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 id="onboarding-title" style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
              Welcome, Adventurer!
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 'var(--space-lg)' }}>
              Let's tune your experience. What's your English level?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const active = difficulty === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDifficulty(opt.id)}
                    style={{
                      textAlign: 'left',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${active ? 'var(--color-grass)' : 'transparent'}`,
                      background: active ? 'var(--color-grass-wash)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                      transition: 'all var(--motion-fast) var(--motion-ease)',
                    }}
                  >
                    <span style={{ fontSize: 28 }} aria-hidden="true">{opt.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-title)', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{opt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleClose} style={skipBtnStyle}>Skip</button>
              <button
                onClick={() => { persistDifficulty(difficulty); setStep(2) }}
                style={primaryBtnStyle}
              >
                {'Next →'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
              Your first quest
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 'var(--space-lg)' }}>
              We picked a course matching your level. Ready to dive in?
            </p>
            {recommended ? (
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
                border: '2px solid var(--color-grass-wash)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-grass-active)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recommended for you
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-title)', marginBottom: 6 }}>
                  {recommended.title || recommended.id}
                </div>
                {recommended.description && (
                  <div style={{ fontSize: 13, color: 'var(--color-body)', marginBottom: 8 }}>
                    {recommended.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: 12, color: 'var(--color-muted)' }}>
                  {recommended.difficulty && <span>{'\u{1F3AF} '}{recommended.difficulty}</span>}
                  {recommended.est_minutes && <span>{'\u23F1 '}{recommended.est_minutes} min</span>}
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 'var(--space-lg)' }}>
                Browse the full catalog when you're ready.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(1)} style={skipBtnStyle}>{'← Back'}</button>
              <button onClick={() => setStep(3)} style={primaryBtnStyle}>{'Next →'}</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', fontSize: 64, marginBottom: 'var(--space-md)' }} aria-hidden="true">
              {'\u{1F3C6}'}
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
              You're all set!
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 'var(--space-lg)' }}>
              Complete your first lesson to unlock the <strong style={{ color: 'var(--color-grass-active)' }}>First Steps</strong> achievement and earn XP.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button onClick={handleStartCourse} style={{ ...primaryBtnStyle, width: '100%', justifyContent: 'center' }}>
                Start First Course
              </button>
              <button onClick={handleClose} style={{ ...skipBtnStyle, width: '100%', textAlign: 'center' }}>
                Explore on my own
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const primaryBtnStyle = {
  padding: '12px 24px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-grass)',
  color: '#fff',
  border: 'none',
  fontSize: 15,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: 'var(--shadow-button)',
  display: 'inline-flex', alignItems: 'center', gap: 6,
}

const skipBtnStyle = {
  padding: '8px 16px',
  background: 'transparent',
  color: 'var(--color-muted)',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
