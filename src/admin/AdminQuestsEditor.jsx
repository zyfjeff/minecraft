// =============================================================================
// AdminQuestsEditor — Create / Edit a daily quest.
// =============================================================================
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { upsertQuest, listAllQuestsAdmin } from '../lib/admin'

const KIND_OPTIONS = ['listen', 'read', 'vocab', 'quiz']
const COLOR_TOKEN_OPTIONS = ['tile-blue', 'tile-green', 'tile-yellow', 'tile-purple', 'tile-orange', 'tile-teal', 'tile-pink']
const ICON_TOKEN_OPTIONS = ['play', 'grid', 'star', 'lock']

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '2px solid var(--color-surface-soft)',
  background: 'var(--color-cream)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-title)',
}

const btnStyle = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: 14, color: 'var(--color-title)', fontWeight: 700 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
      <label style={{ width: 120, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', flexShrink: 0 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

export default function AdminQuestsEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [form, setForm] = useState({
    id: '',
    kind: 'listen',
    title: '',
    description: '',
    xp_reward: 10,
    duration_min: 5,
    unlock_level: 1,
    route: '',
    color_token: 'tile-blue',
    icon_token: 'play',
    sort_order: 0,
    active: true,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      try {
        const all = await listAllQuestsAdmin()
        const quest = all.find((q) => q.id === id)
        if (quest) {
          setForm({
            id: quest.id || '',
            kind: quest.kind || 'listen',
            title: quest.title || '',
            description: quest.description || '',
            xp_reward: quest.xp_reward ?? 10,
            duration_min: quest.duration_min ?? 5,
            unlock_level: quest.unlock_level ?? 1,
            route: quest.route || '',
            color_token: quest.color_token || 'tile-blue',
            icon_token: quest.icon_token || 'play',
            sort_order: quest.sort_order ?? 0,
            active: quest.active ?? true,
          })
        } else {
          setError('Quest not found')
        }
      } catch (err) {
        setError(err.message || 'Failed to load quest')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isNew])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.id.trim()) {
      setError('ID is required')
      return
    }
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await upsertQuest({
        id: form.id.trim(),
        kind: form.kind,
        title: form.title.trim(),
        description: form.description.trim(),
        xp_reward: Number(form.xp_reward) || 0,
        duration_min: Number(form.duration_min) || null,
        unlock_level: Number(form.unlock_level) || 1,
        route: form.route.trim() || null,
        color_token: form.color_token,
        icon_token: form.icon_token,
        sort_order: Number(form.sort_order) || 0,
        active: form.active,
      })
      navigate('/admin/quests')
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading quest...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title)' }}>
            {isNew ? 'New Quest' : 'Edit Quest'}
          </h2>
          <Link to="/admin/quests" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Quest Manager
          </Link>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...btnStyle, background: 'var(--color-grass)', color: 'white', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Quest'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--radius-md)',
          background: '#FDECEC',
          color: 'var(--color-danger)',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 'var(--space-lg)',
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <Section title="Basic Info">
          <Row label="ID">
            <input
              style={inputStyle}
              value={form.id}
              onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
              placeholder="listen-basics"
              disabled={!isNew}
            />
          </Row>
          <Row label="Title">
            <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Listen: Basics" />
          </Row>
          <Row label="Description">
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Complete a listening lesson"
            />
          </Row>
          <Row label="Kind">
            <select style={inputStyle} value={form.kind} onChange={(e) => set('kind', e.target.value)}>
              {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Row>
        </Section>

        <Section title="Rewards & Requirements">
          <Row label="XP Reward">
            <input style={inputStyle} type="number" min={0} value={form.xp_reward} onChange={(e) => set('xp_reward', e.target.value)} />
          </Row>
          <Row label="Duration (min)">
            <input style={inputStyle} type="number" min={0} value={form.duration_min} onChange={(e) => set('duration_min', e.target.value)} />
          </Row>
          <Row label="Unlock Level">
            <input style={inputStyle} type="number" min={1} value={form.unlock_level} onChange={(e) => set('unlock_level', e.target.value)} />
          </Row>
          <Row label="Route">
            <input style={inputStyle} value={form.route} onChange={(e) => set('route', e.target.value)} placeholder="/courses or /video/course-id" />
          </Row>
        </Section>

        <Section title="Display">
          <Row label="Color Token">
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {COLOR_TOKEN_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => set('color_token', c)}
                  style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: form.color_token === c ? '3px solid var(--color-title)' : '2px solid transparent',
                    background: `var(--${c})`, cursor: 'pointer',
                  }}
                  title={c}
                />
              ))}
            </div>
          </Row>
          <Row label="Icon Token">
            <select style={inputStyle} value={form.icon_token} onChange={(e) => set('icon_token', e.target.value)}>
              {ICON_TOKEN_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Row>
          <Row label="Sort Order">
            <input style={inputStyle} type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </Row>
          <Row label="Active">
            <button
              onClick={() => set('active', !form.active)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: form.active ? 'var(--color-grass)' : '#ccc',
                position: 'relative', transition: 'background 200ms',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: 'white', transition: 'left 200ms',
                left: form.active ? 23 : 3,
              }} />
            </button>
          </Row>
        </Section>

        {/* Preview */}
        <Section title="Preview">
          <div style={{
            padding: 'var(--space-md)',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: `var(--${form.color_token})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: 'white',
              }}>
                {form.icon_token === 'play' ? '▶' : form.icon_token === 'grid' ? '📝' : form.icon_token === 'star' ? '⭐' : '🔒'}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: `var(--${form.color_token})`, textTransform: 'uppercase' }}>
                {form.kind}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-title)', marginBottom: 4 }}>
              {form.title || 'Quest Title'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 'var(--space-sm)' }}>
              {form.description || 'Quest description'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-xp)', background: 'rgba(123,31,162,0.08)', padding: '3px 8px', borderRadius: 'var(--radius-pill)' }}>
                +{form.xp_reward} XP
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {form.duration_min ? `${form.duration_min} min` : ''} · Lv.{form.unlock_level}
              </span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
