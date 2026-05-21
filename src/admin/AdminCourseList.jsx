// =============================================================================
// AdminCourseList — List all courses with CRUD actions.
// =============================================================================
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  listAllCourses, deleteCourse, upsertCourse,
  upsertLesson, listSegmentsAdmin, deleteSegment, upsertSegment,
  listQuestionsAdmin, deleteQuestion, upsertQuestion,
} from '../lib/admin'

const KIND_COLORS = {
  listening: '#4a90d9',
  reading: '#e6a817',
  vocabulary: '#6fba2c',
}

export default function AdminCourseList() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllCourses()
      setCourses(data)
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete course "${title}"? This will also delete all lessons and segments.`)) return
    try {
      await deleteCourse(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'unknown'))
    }
  }

  async function handleToggleActive(course) {
    try {
      const updated = await upsertCourse({ id: course.id, is_active: !course.is_active })
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_active: updated.is_active } : c))
    } catch (err) {
      alert('Toggle failed: ' + (err.message || 'unknown'))
    }
  }

  // -------- Bulk Import (multi-course JSON array) --------
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkJson, setBulkJson] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkLog, setBulkLog] = useState([])

  function logLine(msg) {
    setBulkLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`])
    // eslint-disable-next-line no-console
    console.log('[bulk]', msg)
  }

  async function importOneCourse(payload) {
    if (!payload?.course?.id) throw new Error('Missing course.id')
    const courseId = payload.course.id
    const lessonId = payload.lesson?.id || `${courseId}/01`

    // 1. Course
    await upsertCourse({
      ...payload.course,
      id: courseId,
      kind: payload.course.kind || 'listening',
      is_active: payload.course.is_active !== false,
    })

    // 2. Lesson
    if (payload.lesson) {
      await upsertLesson({
        ...payload.lesson,
        id: lessonId,
        course_id: courseId,
        step_index: payload.lesson.step_index ?? 0,
        kind: payload.lesson.kind || 'video_segment',
        highlight_words: Array.isArray(payload.lesson.highlight_words) ? payload.lesson.highlight_words : [],
      })
    }

    // 3. Segments — delete existing then insert fresh
    const oldSegs = await listSegmentsAdmin(lessonId)
    for (const s of oldSegs) {
      await deleteSegment(s.id)
    }
    if (Array.isArray(payload.segments)) {
      for (let i = 0; i < payload.segments.length; i++) {
        const seg = payload.segments[i]
        const { id: _drop, ...rest } = seg // eslint-disable-line no-unused-vars
        await upsertSegment({
          ...rest,
          lesson_id: lessonId,
          sort_order: i,
          distractors: Array.isArray(seg.distractors) ? seg.distractors : [],
        })
      }
    }

    // 4. Cooldown question — delete existing then insert if provided
    const oldQs = await listQuestionsAdmin(lessonId)
    for (const q of oldQs) {
      await deleteQuestion(q.id)
    }
    if (payload.question) {
      const { id: _drop, ...rest } = payload.question // eslint-disable-line no-unused-vars
      await upsertQuestion({
        ...rest,
        lesson_id: lessonId,
        sort_order: 0,
      })
    }
  }

  async function handleBulkImport() {
    if (!bulkJson.trim()) { alert('Paste a JSON array of course payloads first.'); return }
    let arr
    try { arr = JSON.parse(bulkJson) } catch (err) { alert('Invalid JSON: ' + err.message); return }
    if (!Array.isArray(arr)) { alert('JSON root must be an array of {course, lesson, segments, question?} payloads.'); return }
    if (!window.confirm(`Bulk import ${arr.length} courses?\n\nThis will UPSERT all courses and REPLACE existing segments/questions.`)) return

    setBulkBusy(true)
    setBulkLog([])
    let okCount = 0
    let failCount = 0
    const failed = []
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      const id = item?.course?.id || `(item ${i})`
      try {
        logLine(`[${i + 1}/${arr.length}] ${id} — start`)
        await importOneCourse(item)
        logLine(`[${i + 1}/${arr.length}] ${id} — OK (${item.segments?.length || 0} segs)`)
        okCount++
      } catch (err) {
        const msg = err?.message || String(err)
        logLine(`[${i + 1}/${arr.length}] ${id} — FAIL: ${msg}`)
        failed.push({ id, error: msg })
        failCount++
      }
    }
    setBulkBusy(false)
    logLine(`=== Done: ${okCount} ok, ${failCount} failed ===`)
    alert(`Bulk import finished.\nOK: ${okCount}\nFailed: ${failCount}${failed.length ? '\n\n' + failed.map((f) => `- ${f.id}: ${f.error}`).join('\n') : ''}`)
    // Reload list
    await load()
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title)' }}>Course Manager</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
            Manage listening courses, lessons, and segments
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/course/new')}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-pill)',
            border: 'none', background: 'var(--color-grass)', color: 'white',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          + New Course
        </button>
      </div>

      {/* Back link */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <Link to="/admin/rewards" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
          Rewards Manager →
        </Link>
        <Link to="/admin/quests" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
          Quest Manager →
        </Link>
        <Link to="/" style={{ fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 600 }}>
          Back to App
        </Link>
        <button
          type="button"
          onClick={() => setBulkOpen((v) => !v)}
          style={{
            marginLeft: 'auto',
            fontSize: 12, fontWeight: 700, padding: '4px 10px',
            border: '1px solid #f0a020', background: '#fff7e6',
            color: '#a0660a', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          {bulkOpen ? '▾' : '▸'} ⚡ Bulk Import
        </button>
      </div>

      {/* Bulk Import panel */}
      {bulkOpen && (
        <div
          data-testid="bulk-import-panel"
          style={{
            marginBottom: 'var(--space-lg)', padding: 'var(--space-md)',
            background: '#fff7e6', border: '1px dashed #f0a020', borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a0660a', marginBottom: 6 }}>
            ⚡ Bulk Import — paste a JSON ARRAY of course payloads
          </div>
          <div style={{ fontSize: 11, color: '#7a5500', marginBottom: 8 }}>
            Each item: <code>{'{ course, lesson, segments[], question? }'}</code> — same shape as single-course Import JSON.
            Existing courses will be UPSERTed; existing segments/questions for the lesson will be REPLACED.
          </div>
          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            placeholder='[ { "course": {...}, "lesson": {...}, "segments": [...] }, ... ]'
            disabled={bulkBusy}
            rows={8}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: 8, fontSize: 11, fontFamily: 'monospace',
              border: '1px solid #ccc', borderRadius: 4, resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkBusy}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: bulkBusy ? '#aaa' : '#f0a020',
                color: 'white', fontWeight: 700, fontSize: 13,
                cursor: bulkBusy ? 'not-allowed' : 'pointer',
              }}
            >
              {bulkBusy ? 'Importing…' : 'Run Bulk Import'}
            </button>
            <button
              type="button"
              onClick={() => { setBulkJson(''); setBulkLog([]) }}
              disabled={bulkBusy}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ccc', background: 'white',
                color: '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <span style={{ fontSize: 11, color: '#7a5500' }}>
              Tip: paste array length first, watch the log below.
            </span>
          </div>
          {bulkLog.length > 0 && (
            <div
              data-testid="bulk-import-log"
              style={{
                marginTop: 10, padding: 8, background: '#1e1e1e', color: '#9cc',
                fontFamily: 'monospace', fontSize: 11, borderRadius: 4,
                maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap',
              }}
            >
              {bulkLog.join('\n')}
            </div>
          )}
        </div>
      )}

      {/* Loading / Error */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>Loading courses...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', color: 'var(--color-danger)', marginTop: 40 }}>{error}</p>
      ) : courses.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: 40 }}>No courses yet. Create one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                padding: 'var(--space-md) var(--space-lg)',
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0,0,0,0.06)',
                opacity: course.is_active ? 1 : 0.6,
              }}
            >
              {/* Kind badge */}
              <span style={{
                padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                background: KIND_COLORS[course.kind] || '#999', color: 'white',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 60, textAlign: 'center',
              }}>
                {course.kind}
              </span>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-title)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {course.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  id: {course.id} · {course.lessons_count} lesson(s) · Lv.{course.unlock_level} · {course.est_minutes}min
                </div>
              </div>

              {/* Difficulty */}
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                {'★'.repeat(course.difficulty)}{'☆'.repeat(3 - course.difficulty)}
              </span>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(course)}
                title={course.is_active ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: course.is_active ? 'var(--color-grass)' : '#ccc',
                  position: 'relative', transition: 'background 200ms',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', transition: 'left 200ms',
                  left: course.is_active ? 18 : 2,
                }} />
              </button>

              {/* Edit */}
              <button
                onClick={() => navigate(`/admin/course/${course.id}`)}
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
                onClick={() => handleDelete(course.id, course.title)}
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
