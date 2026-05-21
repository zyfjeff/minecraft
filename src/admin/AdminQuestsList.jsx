// =============================================================================
// AdminQuestsList — Manage daily quests (CRUD list view).
// =============================================================================
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAllQuestsAdmin, deleteQuest, upsertQuest } from '../lib/admin'

const KIND_COLORS = {
  listen: '#4a90d9',
  read: '#e6a817',
  vocab: '#6fba2c',
  quiz: '#b77dee',
}

const ICON_EMOJIS = {
  play: '▶️',
  grid: '📝',
  star: '⭐',
  lock: '🔒',
}

export default function AdminQuestsList() {
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllQuestsAdmin()
      setQuests(data)
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete quest "${title}"? This cannot be undone.`)) return
    try {
      await deleteQuest(id)
      setQuests((prev) => prev.filter((q) => q.id !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'unknown'))
    }
  }

  async function handleToggleActive(quest) {
    try {
      const updated = await upsertQuest({ id: quest.id, active: !quest.active })
      setQuests((prev) => prev.map((q) => q.id === quest.id ? { ...q, active: updated.active } : q))
    } catch (err) {
      alert('Toggle failed: ' + (err.message || 'unknown'))
    }
  }

  // Summary stats
  const activeCount = quests.filter((q) => q.active).length
  const inactiveCount = quests.length - activeCount
  const kindCounts = quests.reduce((acc, q) => { acc[q.kind] = (acc[q.kind] || 0) + 1; return acc }, {})

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title)' }}>Quest Manager</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Manage daily quests shown on the Home page
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/quest/new')}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-pill)',
            border: 'none', background: 'var(--color-grass)', color: 'white',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          + New Quest
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <Link to="/admin" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
          ← Course Manager
        </Link>
        <Link to="/admin/rewards" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
          Rewards Manager →
        </Link>
        <Link to="/" style={{ fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 600 }}>
          Back to App
        </Link>
      </div>

      {/* Summary stats */}
      {!loading && quests.length > 0 && (
        <div style={{
          display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap',
          marginBottom: 'var(--space-lg)', fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-soft)', color: 'var(--color-body)' }}>
            {quests.length} Total
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--color-grass-wash)', color: 'var(--color-emerald)' }}>
            {activeCount} Active
          </span>
          {inactiveCount > 0 && (
            <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: '#FDECEC', color: 'var(--color-danger)' }}>
              {inactiveCount} Inactive
            </span>
          )}
          {Object.entries(kindCounts).map(([kind, count]) => (
            <span key={kind} style={{
              padding: '4px 10px', borderRadius: 'var(--radius-pill)',
              background: 'rgba(0,0,0,0.04)', color: KIND_COLORS[kind] || 'var(--color-muted)',
            }}>
              {kind}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Loading / Error */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>Loading quests...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', color: 'var(--color-danger)', marginTop: 40 }}>{error}</p>
      ) : quests.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>No quests yet. Create one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
          {quests.map((quest) => (
            <div
              key={quest.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                padding: 'var(--space-md) var(--space-lg)',
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0,0,0,0.06)',
                opacity: quest.active ? 1 : 0.6,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                {ICON_EMOJIS[quest.icon_token] || '📋'}
              </span>

              {/* Kind badge */}
              <span style={{
                padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                background: KIND_COLORS[quest.kind] || '#999', color: 'white',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 50, textAlign: 'center',
              }}>
                {quest.kind}
              </span>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {quest.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  id: {quest.id} · +{quest.xp_reward} XP · Lv.{quest.unlock_level} · {quest.duration_min || '?'}min
                  {quest.route && ` · ${quest.route}`}
                </div>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(quest)}
                title={quest.active ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: quest.active ? 'var(--color-grass)' : '#ccc',
                  position: 'relative', transition: 'background 200ms',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', transition: 'left 200ms',
                  left: quest.active ? 18 : 2,
                }} />
              </button>

              {/* Edit */}
              <button
                onClick={() => navigate(`/admin/quest/${quest.id}`)}
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
                onClick={() => handleDelete(quest.id, quest.title)}
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
