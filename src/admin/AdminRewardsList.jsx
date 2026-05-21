// =============================================================================
// AdminRewardsList — List all achievements with CRUD actions + user unlocks.
// Follows the same pattern as AdminCourseList.
// =============================================================================
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAllAchievements, deleteAchievement, upsertAchievement } from '../lib/admin'

const CONDITION_COLORS = {
  quest_count: '#4a90d9',
  streak:      '#e6a817',
  level:       '#6fba2c',
  vocab_count: '#9b59b6',
}

const ICON_EMOJIS = {
  pickaxe: '⛏️', diamond: '💎', fire: '🔥', book: '📖',
  headphones: '🎧', gem: '💠', star: '⭐', dragon: '🐉',
}

export default function AdminRewardsList() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllAchievements()
      setAchievements(data)
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete achievement "${name}"? This will also remove all user unlock records for this achievement.`)) return
    try {
      await deleteAchievement(id)
      setAchievements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'unknown'))
    }
  }

  async function handleToggleActive(ach) {
    try {
      const updated = await upsertAchievement({ id: ach.id, active: !ach.active })
      setAchievements((prev) => prev.map((a) => a.id === ach.id ? { ...a, active: updated.active } : a))
    } catch (err) {
      alert('Toggle failed: ' + (err.message || 'unknown'))
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title)' }}>Rewards Manager</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Manage achievements, badges, and reward conditions
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/reward/new')}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-pill)',
            border: 'none', background: 'var(--color-grass)', color: 'white',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          + New Achievement
        </button>
      </div>

      {/* Navigation links */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <Link to="/admin" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
          ← Course Manager
        </Link>
        <Link to="/" style={{ fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 600 }}>
          Back to App
        </Link>
      </div>

      {/* Summary stats */}
      {!loading && !error && achievements.length > 0 && (
        <div style={{
          display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-title)' }}>{achievements.length}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-grass)' }}>{achievements.filter(a => a.active).length}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-muted)' }}>{achievements.filter(a => !a.active).length}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inactive</div>
          </div>
          {['quest_count', 'streak', 'level', 'vocab_count'].map((t) => {
            const count = achievements.filter(a => a.condition_type === t).length
            if (count === 0) return null
            return (
              <div key={t} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: CONDITION_COLORS[t] }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.replace('_', ' ')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Loading / Error */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>Loading achievements...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', color: 'var(--color-danger)', marginTop: 40 }}>{error}</p>
      ) : achievements.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>No achievements yet. Create one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {achievements.map((ach) => (
            <div
              key={ach.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                padding: 'var(--space-md) var(--space-lg)',
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0,0,0,0.06)',
                opacity: ach.active ? 1 : 0.6,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 22, width: 36, textAlign: 'center' }}>
                {ICON_EMOJIS[ach.icon] || '🏆'}
              </span>

              {/* Condition badge */}
              <span style={{
                padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                background: CONDITION_COLORS[ach.condition_type] || '#999', color: 'white',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 72, textAlign: 'center',
              }}>
                {ach.condition_type?.replace('_', ' ') || 'unknown'}
              </span>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ach.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  id: {ach.id} · threshold: {ach.threshold} · order: {ach.sort_order}
                </div>
              </div>

              {/* Description */}
              <span style={{ fontSize: 12, color: 'var(--color-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ach.description}
              </span>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(ach)}
                title={ach.active ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: ach.active ? 'var(--color-grass)' : '#ccc',
                  position: 'relative', transition: 'background 200ms',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', transition: 'left 200ms',
                  left: ach.active ? 18 : 2,
                }} />
              </button>

              {/* Edit */}
              <button
                onClick={() => navigate(`/admin/reward/${ach.id}`)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-grass)', background: 'white',
                  color: 'var(--color-grass)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Edit
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(ach.id, ach.name)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid #e05a5a', background: 'white',
                  color: '#e05a5a', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
