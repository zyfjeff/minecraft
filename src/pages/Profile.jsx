// =============================================================================
// Profile — User profile page with stats, display name editing, and account info.
// =============================================================================
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { computeCoursePercent } from '../lib/courses'
import { getLevelTitle } from '../lib/rewards'
import { validateDisplayName } from '../lib/validation'
import { getTheme, setTheme as applyThemePref } from '../lib/theme'

export default function Profile() {
  const {
    profile, authUser, todayCompletions, weekDots,
    courses, coursesLoaded, userCourseProgress,
    achievements, userUnlocks, updateDisplayName,
  } = useAuth()

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [theme, setThemeState] = useState(() => getTheme())

  function handleThemeChange(next) {
    setThemeState(next)
    applyThemePref(next)
  }

  const displayName = profile?.displayName || 'Adventurer'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpToNext = profile?.xpToNext ?? 100
  const xpPercent = profile?.xpPercent ?? 0
  const streak = profile?.streak ?? 0
  const email = authUser?.email || ''

  // Determine level title
  const levelTitle = useMemo(() => getLevelTitle(level), [level])

  // Compute learning stats
  const stats = useMemo(() => {
    const completedCourses = (courses || []).filter((c) => {
      const prog = userCourseProgress[c.id]
      if (!prog) return false
      return computeCoursePercent(c.lessons_count, prog) === 100
    }).length
    const inProgressCourses = (courses || []).filter((c) => {
      const prog = userCourseProgress[c.id]
      if (!prog) return false
      const pct = computeCoursePercent(c.lessons_count, prog)
      return pct > 0 && pct < 100
    }).length
    const totalCompletedLessons = Object.values(userCourseProgress || {})
      .reduce((sum, p) => sum + (p?.completed_lesson_ids?.length || 0), 0)
    const unlockedAchievements = (userUnlocks || []).length
    const totalAchievements = (achievements || []).length
    const todayXp = (todayCompletions || []).reduce((s, c) => s + (Number(c.xp_awarded) || 0), 0)
    const activeDays = (weekDots || []).filter(Boolean).length

    return {
      completedCourses,
      inProgressCourses,
      totalCompletedLessons,
      unlockedAchievements,
      totalAchievements,
      todayXp,
      activeDays,
    }
  }, [courses, userCourseProgress, userUnlocks, achievements, todayCompletions, weekDots])

  function startEdit() {
    setNameInput(displayName)
    setEditing(true)
    setError('')
    setSuccess('')
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    const nameErr = validateDisplayName(trimmed)
    if (nameErr) { setError(nameErr); return }
    if (trimmed === displayName) { setEditing(false); return }
    setSaving(true)
    setError('')
    try {
      await updateDisplayName(trimmed)
      setEditing(false)
      setSuccess('Display name updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    boxShadow: 'var(--shadow-card)',
  }

  const statBoxStyle = {
    flex: 1,
    minWidth: 100,
    textAlign: 'center',
    padding: 'var(--space-md)',
    background: 'rgba(0,0,0,0.02)',
    borderRadius: 'var(--radius-md)',
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-title)', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-display)' }}>
        My Profile
      </h2>

      {/* Profile Card */}
      <div style={{ ...cardStyle, marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-grass)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 0 0 var(--color-grass-active)',
            flexShrink: 0,
          }}>
            <svg width="40" height="40" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
              <rect x="3" y="0" width="10" height="4" fill="#6B4226" />
              <rect x="2" y="4" width="12" height="4" fill="#C69C6D" />
              <rect x="4" y="4" width="2" height="2" fill="#FFFFFF" />
              <rect x="10" y="4" width="2" height="2" fill="#FFFFFF" />
              <rect x="5" y="4" width="1" height="1" fill="#3B2213" />
              <rect x="10" y="4" width="1" height="1" fill="#3B2213" />
              <rect x="6" y="6" width="4" height="1" fill="#C69C6D" />
              <rect x="7" y="7" width="2" height="1" fill="#A0522D" />
              <rect x="4" y="8" width="8" height="4" fill="#00A8A8" />
              <rect x="4" y="12" width="3" height="4" fill="#2C2C8C" />
              <rect x="9" y="12" width="3" height="4" fill="#2C2C8C" />
            </svg>
          </div>

          {/* Name + Level */}
          <div style={{ flex: 1 }}>
            {!editing ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-title)', fontFamily: 'var(--font-display)' }}>
                    {displayName}
                  </span>
                  <button
                    onClick={startEdit}
                    style={{
                      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-surface-soft)', background: 'white',
                      color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 2 }}>
                  {email}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={20}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-grass)', background: 'var(--color-cream)',
                    fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--color-title)',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') cancelEdit() }}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-md)',
                    border: 'none', background: 'var(--color-grass)', color: 'white',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? '...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-md)',
                    border: 'none', background: 'var(--color-surface-soft)', color: 'var(--color-title)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {error && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{error}</div>}
            {success && <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>{success}</div>}
          </div>
        </div>

        {/* Level + XP */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--color-grass-wash)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-grass)', fontFamily: 'var(--font-display)' }}>
              {level}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
              Level
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-emerald)', marginBottom: 4 }}>
              {levelTitle}
            </div>
            <div className="progress-bar" style={{ marginBottom: 4 }}>
              <div className="progress-fill" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, var(--color-grass), var(--color-grass-hover))' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {xp} / {xpToNext} XP to next level
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ ...cardStyle, marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-title)', marginBottom: 'var(--space-md)' }}>
          Learning Stats
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
              {streak}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Day Streak</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-grass)', fontFamily: 'var(--font-display)' }}>
              {stats.activeDays}/7
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>This Week</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-xp)', fontFamily: 'var(--font-display)' }}>
              +{stats.todayXp}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Today's XP</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-emerald)', fontFamily: 'var(--font-display)' }}>
              {stats.totalCompletedLessons}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Lessons Done</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--tile-blue)', fontFamily: 'var(--font-display)' }}>
              {stats.completedCourses}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Courses Done</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--tile-purple)', fontFamily: 'var(--font-display)' }}>
              {stats.unlockedAchievements}/{stats.totalAchievements}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>Achievements</div>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      {coursesLoaded && courses.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-title)', marginBottom: 'var(--space-md)' }}>
            Course Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {courses.filter((c) => {
              const prog = userCourseProgress[c.id]
              return prog && computeCoursePercent(c.lessons_count, prog) > 0
            }).map((c) => {
              const pct = computeCoursePercent(c.lessons_count, userCourseProgress[c.id])
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct === 100 ? 'var(--color-success)' : 'var(--color-grass)',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--color-success)' : 'var(--color-muted)', width: 36, textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
            {courses.filter((c) => {
              const prog = userCourseProgress[c.id]
              return prog && computeCoursePercent(c.lessons_count, prog) > 0
            }).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-md)' }}>
                No courses started yet. <Link to="/courses" style={{ color: 'var(--color-grass)', fontWeight: 600, textDecoration: 'none' }}>Browse courses</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Theme Switcher */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 'var(--space-sm)',
        }}>
          <h3 style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Appearance
          </h3>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {theme === 'auto' ? 'Follows system' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
        </div>
        <div role="radiogroup" aria-label="Theme" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)',
        }}>
          {[
            { id: 'auto', label: 'Auto', icon: '\u{1F5A5}' },
            { id: 'light', label: 'Light', icon: '\u2600\uFE0F' },
            { id: 'dark', label: 'Dark', icon: '\u{1F319}' },
          ].map((opt) => {
            const active = theme === opt.id
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={active}
                onClick={() => handleThemeChange(opt.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${active ? 'var(--color-grass)' : 'transparent'}`,
                  background: active ? 'var(--color-grass-wash)' : 'var(--color-surface-soft)',
                  color: active ? 'var(--color-grass-active)' : 'var(--color-body)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all var(--motion-fast) var(--motion-ease)',
                }}
              >
                <span style={{ fontSize: 18 }} aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap',
        justifyContent: 'center', marginBottom: 'var(--space-lg)',
      }}>
        <Link to="/courses" style={{
          padding: '10px 20px', borderRadius: 'var(--radius-pill)',
          background: 'var(--color-surface)', color: 'var(--color-grass)',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          border: '1px solid var(--color-grass)',
        }}>
          Browse Courses
        </Link>
        <Link to="/achievements" style={{
          padding: '10px 20px', borderRadius: 'var(--radius-pill)',
          background: 'var(--color-surface)', color: 'var(--color-xp)',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          border: '1px solid var(--color-xp)',
        }}>
          View Achievements
        </Link>
      </div>
    </div>
  )
}
