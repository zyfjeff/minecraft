// =============================================================================
// AdminRewardsEditor — Achievement editor with unlock monitoring.
// Follows the same pattern as AdminCourseEditor but much simpler since
// achievements only have ~9 fields.
// =============================================================================
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  upsertAchievement,
  listAchievementUnlocks,
  revokeUserAchievement,
} from '../lib/admin'
import { supabase } from '../lib/supabase'

const ICON_OPTIONS = ['pickaxe', 'diamond', 'fire', 'book', 'headphones', 'gem', 'star', 'dragon']
const COLOR_TOKEN_OPTIONS = ['tile-teal', 'tile-blue', 'tile-orange', 'tile-green', 'tile-purple', 'tile-yellow', 'tile-pink']
const CONDITION_OPTIONS = ['quest_count', 'streak', 'level', 'vocab_count']

const ICON_EMOJIS = {
  pickaxe: '⛏️', diamond: '💎', fire: '🔥', book: '📖',
  headphones: '🎧', gem: '💠', star: '⭐', dragon: '🐉',
}

export default function AdminRewardsEditor() {
  const { id: achievementId } = useParams()
  const isNew = !achievementId
  const navigate = useNavigate()

  // -- Achievement state
  const [achievement, setAchievement] = useState({
    id: '', name: '', description: '', icon: 'pickaxe',
    color_token: 'tile-teal', condition_type: 'quest_count',
    threshold: 1, sort_order: 0, active: true,
  })

  // -- Unlocks (who unlocked this achievement)
  const [unlocks, setUnlocks] = useState([])
  const [unlocksLoading, setUnlocksLoading] = useState(false)

  // -- UI state
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Load existing achievement
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('id', achievementId)
          .single()
        if (error) throw error
        if (!cancelled && data) {
          setAchievement(data)
        }
      } catch (err) {
        if (!cancelled) alert('Failed to load achievement: ' + err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [achievementId, isNew])

  // Load unlocks for existing achievement
  useEffect(() => {
    if (isNew || !achievementId) return
    let cancelled = false
    async function loadUnlocks() {
      setUnlocksLoading(true)
      try {
        const data = await listAchievementUnlocks(achievementId)
        if (!cancelled) setUnlocks(data)
      } catch {
        // non-critical, silently fail
      } finally {
        if (!cancelled) setUnlocksLoading(false)
      }
    }
    loadUnlocks()
    return () => { cancelled = true }
  }, [achievementId, isNew])

  function updateField(field, value) {
    setAchievement(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!achievement.id) { alert('Achievement ID is required'); return }
    if (!achievement.name) { alert('Name is required'); return }
    setSaving(true)
    setToast('')
    try {
      const payload = { ...achievement }
      delete payload.created_at
      delete payload.updated_at
      await upsertAchievement(payload)
      setToast('Saved successfully!')
      setTimeout(() => setToast(''), 3000)
      if (isNew) {
        navigate(`/admin/reward/${achievement.id}`, { replace: true })
      }
    } catch (err) {
      alert('Save failed: ' + (err.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }, [achievement, isNew, navigate])

  async function handleRevoke(userId) {
    if (!window.confirm(`Revoke this achievement unlock for user ${userId.slice(0, 8)}...?`)) return
    try {
      await revokeUserAchievement(userId, achievementId)
      setUnlocks(prev => prev.filter(u => u.user_id !== userId))
    } catch (err) {
      alert('Revoke failed: ' + (err.message || 'unknown'))
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title)' }}>
            {isNew ? 'New Achievement' : 'Edit Achievement'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            {isNew ? 'Create a new achievement for the rewards system' : `Editing: ${achievement.name}`}
          </p>
        </div>
        {toast && (
          <span style={{
            padding: '8px 16px', borderRadius: 'var(--radius-pill)',
            background: 'var(--color-grass)', color: 'white',
            fontSize: 13, fontWeight: 600,
          }}>
            {toast}
          </span>
        )}
      </div>

      <Link to="/admin/rewards" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginBottom: 'var(--space-lg)' }}>
        ← Back to Rewards Manager
      </Link>

      {/* ================================================================= */}
      {/* Achievement Info */}
      {/* ================================================================= */}
      <Section title="Achievement Info">
        <Row label="ID (kebab-case)">
          <input
            value={achievement.id} disabled={!isNew}
            onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="e.g. streak-master"
            style={{ ...inputStyle, background: isNew ? undefined : '#f5f5f5' }}
          />
        </Row>
        <Row label="Name">
          <input value={achievement.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Streak Master" style={inputStyle} />
        </Row>
        <Row label="Description">
          <textarea value={achievement.description} onChange={(e) => updateField('description', e.target.value)} rows={2} placeholder="What the player needs to do" style={{ ...inputStyle, resize: 'vertical' }} />
        </Row>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Row label="Icon">
            <select value={achievement.icon} onChange={(e) => updateField('icon', e.target.value)} style={inputStyle}>
              {ICON_OPTIONS.map((i) => <option key={i} value={i}>{ICON_EMOJIS[i] || ''} {i}</option>)}
            </select>
          </Row>
          <Row label="Color Token">
            <select value={achievement.color_token} onChange={(e) => updateField('color_token', e.target.value)} style={inputStyle}>
              {COLOR_TOKEN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Row label="Condition Type">
            <select value={achievement.condition_type} onChange={(e) => updateField('condition_type', e.target.value)} style={inputStyle}>
              {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </Row>
          <Row label="Threshold">
            <input type="number" value={achievement.threshold} onChange={(e) => updateField('threshold', Number(e.target.value))} min={1} style={inputStyle} />
          </Row>
          <Row label="Sort Order">
            <input type="number" value={achievement.sort_order} onChange={(e) => updateField('sort_order', Number(e.target.value))} style={inputStyle} />
          </Row>
        </div>

        <Row label="Active">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={achievement.active} onChange={(e) => updateField('active', e.target.checked)} />
            <span style={{ fontSize: 13 }}>{achievement.active ? 'Visible to players' : 'Hidden'}</span>
          </label>
        </Row>
      </Section>

      {/* ================================================================= */}
      {/* Preview */}
      {/* ================================================================= */}
      <Section title="Preview">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
          padding: 'var(--space-md)', background: 'rgba(0,0,0,0.02)',
          borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span style={{ fontSize: 28 }}>{ICON_EMOJIS[achievement.icon] || '🏆'}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-title)' }}>
              {achievement.name || 'Achievement Name'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              {achievement.description || 'Description...'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              Condition: <strong>{achievement.condition_type?.replace('_', ' ')}</strong> ≥ {achievement.threshold}
            </div>
          </div>
        </div>
      </Section>

      {/* ================================================================= */}
      {/* User Unlocks (only for existing achievements) */}
      {/* ================================================================= */}
      {!isNew && (
        <Section title={`User Unlocks (${unlocks.length})`}>
          {unlocksLoading ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading unlocks...</p>
          ) : unlocks.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No users have unlocked this achievement yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unlocks.map((u) => (
                <div
                  key={u.user_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    padding: '8px 12px', background: 'rgba(0,0,0,0.02)',
                    borderRadius: 'var(--radius-sm)', fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: 'var(--color-muted)' }}>
                    {u.user_id}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {new Date(u.unlocked_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRevoke(u.user_id)}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid #e05a5a', background: 'white',
                      color: '#e05a5a', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ================================================================= */}
      {/* Bottom action bar */}
      {/* ================================================================= */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingBottom: 60 }}>
        <button onClick={() => navigate('/admin/rewards')} style={{ ...btnStyle, background: '#eee', color: '#555' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: 'var(--color-grass)', color: 'white', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Achievement'}
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components (same pattern as AdminCourseEditor)
// =============================================================================

function Section({ title, children }) {
  return (
    <section style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 var(--space-md)', fontSize: 15, color: 'var(--color-title)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 8 }}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 13,
  fontFamily: 'var(--font-body)', boxSizing: 'border-box',
}

const btnStyle = {
  padding: '10px 20px', borderRadius: 'var(--radius-pill)',
  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}
