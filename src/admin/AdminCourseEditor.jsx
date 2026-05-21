// =============================================================================
// AdminCourseEditor — Full course editor with Course info, Lesson, Segments,
// and Cooldown Question sections.
// =============================================================================
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  upsertCourse,
  listLessonsAdmin,
  upsertLesson,
  listSegmentsAdmin,
  upsertSegment,
  deleteSegment,
  listQuestionsAdmin,
  upsertQuestion,
  deleteQuestion,
} from '../lib/admin'
import { supabase } from '../lib/supabase'
import { parseYouTubeVtt } from '../lib/parseYouTubeVtt'

const QTYPE_OPTIONS_LISTENING = [
  'cloze', 'comprehension', 'detail_mcq', 'true_false',
  'sound_match', 'speaker_intent', 'phonetic_pair', 'none',
]

const QTYPE_OPTIONS_READING = [
  'vocabulary_cloze', 'comprehension', 'true_false',
  'word_match', 'sentence_order', 'none',
]

const LICENSE_OPTIONS = ['', 'CC-BY-SA-4.0', 'youtube-embed', 'original']
const KIND_OPTIONS = ['listening', 'reading', 'vocabulary']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function emptySegment(sortOrder, lessonId, isReading = false) {
  return {
    _key: `new-${Date.now()}-${Math.random()}`,
    lesson_id: lessonId,
    sort_order: sortOrder,
    start_sec: 0,
    end_sec: 0,
    sentence_en: '',
    sentence_zh: '',
    blank_word: '',
    distractors: [],
    qtype: isReading ? 'vocabulary_cloze' : 'cloze',
    quiz_payload: {},
  }
}

function emptyQuestion(lessonId) {
  return {
    _key: `newq-${Date.now()}`,
    lesson_id: lessonId,
    kind: 'mcq',
    prompt: '',
    payload: { options: ['', '', '', ''], correct: 0 },
    xp_reward: 5,
    sort_order: 0,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminCourseEditor() {
  const { id: courseId } = useParams() // undefined for "new"
  const isNew = !courseId
  const navigate = useNavigate()

  // -- Course state
  const [course, setCourse] = useState({
    id: '', kind: 'listening', title: '', description: '',
    difficulty: 1, est_minutes: 5, xp_reward: 40, unlock_level: 1,
    source_label: '', source_url: '', source_license: 'youtube-embed',
    sort_order: 0, is_active: true,
  })

  // -- Lesson state (single lesson per listening course)
  const [lesson, setLesson] = useState({
    id: '', course_id: '', step_index: 0, kind: 'video_segment',
    title: '', yt_video_id: '', yt_start_sec: 0, yt_end_sec: 0,
    transcript_en: '', transcript_zh: '', highlight_words: [], xp_reward: 20,
  })

  // -- Segments state
  const [segments, setSegments] = useState([])
  const [deletedSegmentIds, setDeletedSegmentIds] = useState([])

  // -- Cooldown question state
  const [question, setQuestion] = useState(null)
  const [deletedQuestionId, setDeletedQuestionId] = useState(null)

  // -- UI state
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [highlightInput, setHighlightInput] = useState('')
  // Listening Auto-split: pasted VTT and parser config
  const [vttPaste, setVttPaste] = useState('')
  const [vttMinSec, setVttMinSec] = useState(15)
  const [vttMaxSec, setVttMaxSec] = useState(40)
  // Import Course JSON: pasted full course payload
  const [importJson, setImportJson] = useState('')
  const [showImport, setShowImport] = useState(false)

  // -- Import full course from JSON
  const handleImportJson = useCallback(() => {
    if (!importJson.trim()) { alert('Please paste a course JSON first.'); return }
    let parsed
    try {
      parsed = JSON.parse(importJson)
    } catch (err) {
      alert('Invalid JSON: ' + err.message)
      return
    }
    if (!parsed || typeof parsed !== 'object') { alert('JSON root must be an object.'); return }
    const c = parsed.course
    if (!c || !c.id) { alert('JSON must include course.id'); return }
    if (segments.length > 0 && !window.confirm(`This will REPLACE the current course (${segments.length} segments). Continue?`)) return

    // Apply course
    setCourse((prev) => ({ ...prev, ...c }))

    // Apply lesson
    if (parsed.lesson) {
      setLesson((prev) => ({
        ...prev,
        ...parsed.lesson,
        course_id: c.id,
        highlight_words: Array.isArray(parsed.lesson.highlight_words) ? parsed.lesson.highlight_words : [],
      }))
    }

    // Apply segments
    if (Array.isArray(parsed.segments)) {
      const lessonId = parsed.lesson?.id || `${c.id}/01`
      const newSegs = parsed.segments.map((s, i) => ({
        ...emptySegment(i, lessonId, c.kind === 'reading'),
        ...s,
        sort_order: i,
        lesson_id: lessonId,
        _key: `import-${Date.now()}-${i}`,
      }))
      setSegments(newSegs)
      setDeletedSegmentIds([])
    }

    // Apply question
    if (parsed.question) {
      const lessonId = parsed.lesson?.id || `${c.id}/01`
      setQuestion({
        ...emptyQuestion(lessonId),
        ...parsed.question,
        lesson_id: lessonId,
        _key: `importq-${Date.now()}`,
      })
    } else {
      setQuestion(null)
    }

    setToast(`Imported: ${parsed.segments?.length || 0} segments${parsed.question ? ' + 1 question' : ''}`)
    setTimeout(() => setToast(''), 4000)
    setImportJson('')
    setShowImport(false)
  }, [importJson, segments])

  // -- Load existing course data
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        // Load course
        const { data: cRow, error: cErr } = await supabase
          .from('courses').select('*').eq('id', courseId).single()
        if (cErr) throw cErr
        if (cancelled) return
        setCourse(cRow)

        // Load lesson
        const lessons = await listLessonsAdmin(courseId)
        const les = lessons[0] || null
        if (les) {
          setLesson(les)
          // Load segments
          const segs = await listSegmentsAdmin(les.id)
          setSegments(segs.map((s) => ({ ...s, _key: `db-${s.id}` })))
          // Load questions
          const qs = await listQuestionsAdmin(les.id)
          if (qs.length > 0) setQuestion({ ...qs[0], _key: `dbq-${qs[0].id}` })
        }
      } catch (err) {
        alert('Failed to load course: ' + (err.message || 'unknown'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [courseId, isNew])

  // -- Handlers: Course
  function updateCourse(field, value) {
    setCourse((prev) => ({ ...prev, [field]: value }))
  }

  // -- Handlers: Lesson
  function updateLesson(field, value) {
    setLesson((prev) => ({ ...prev, [field]: value }))
  }

  // -- Handlers: Segments
  function updateSegment(index, field, value) {
    setSegments((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function updateSegmentPayload(index, field, value) {
    setSegments((prev) => prev.map((s, i) => {
      if (i !== index) return s
      return { ...s, quiz_payload: { ...(s.quiz_payload || {}), [field]: value } }
    }))
  }

  function addSegment() {
    const lessonId = lesson.id || `${course.id}/01`
    const isReading = course.kind === 'reading'
    setSegments((prev) => [...prev, emptySegment(prev.length, lessonId, isReading)])
  }

  function removeSegment(index) {
    const seg = segments[index]
    if (seg?.id) setDeletedSegmentIds((prev) => [...prev, seg.id])
    setSegments((prev) => prev.filter((_, i) => i !== index))
  }

  // -- Handlers: Question
  function addQuestion() {
    const lessonId = lesson.id || `${course.id}/01`
    setQuestion(emptyQuestion(lessonId))
  }

  function removeQuestion() {
    if (question?.id) setDeletedQuestionId(question.id)
    setQuestion(null)
  }

  function updateQuestion(field, value) {
    setQuestion((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  function updateQuestionPayload(field, value) {
    setQuestion((prev) => prev ? {
      ...prev,
      payload: { ...(prev.payload || {}), [field]: value },
    } : prev)
  }

  // -- Save all
  const handleSave = useCallback(async () => {
    if (!course.id) { alert('Course ID is required'); return }
    setSaving(true)
    setToast('')
    try {
      // 1. Upsert course
      const coursePayload = { ...course }
      delete coursePayload.lessons
      delete coursePayload.lessons_count
      delete coursePayload.created_at
      delete coursePayload.updated_at
      await upsertCourse(coursePayload)

      // 2. Upsert lesson
      const lessonId = lesson.id || `${course.id}/01`
      const lessonPayload = {
        ...lesson,
        id: lessonId,
        course_id: course.id,
        highlight_words: Array.isArray(lesson.highlight_words) ? lesson.highlight_words : [],
      }
      delete lessonPayload.created_at
      delete lessonPayload.updated_at
      delete lessonPayload._key
      await upsertLesson(lessonPayload)
      setLesson((prev) => ({ ...prev, id: lessonId, course_id: course.id }))

      // 3. Delete removed segments
      for (const segId of deletedSegmentIds) {
        await deleteSegment(segId)
      }
      setDeletedSegmentIds([])

      // 4. Upsert segments
      const savedSegments = []
      for (let i = 0; i < segments.length; i++) {
        const seg = { ...segments[i] }
        seg.lesson_id = lessonId
        seg.sort_order = i
        delete seg._key
        delete seg.created_at
        delete seg.updated_at
        // Clean up payload for qtype
        if (seg.qtype === 'cloze' || seg.qtype === 'vocabulary_cloze' || seg.qtype === 'none') {
          seg.quiz_payload = null
        }
        const saved = await upsertSegment(seg)
        savedSegments.push({ ...saved, _key: `db-${saved.id}` })
      }
      setSegments(savedSegments)

      // 5. Handle question
      if (deletedQuestionId) {
        await deleteQuestion(deletedQuestionId)
        setDeletedQuestionId(null)
      }
      if (question) {
        const qPayload = { ...question }
        qPayload.lesson_id = lessonId
        delete qPayload._key
        delete qPayload.created_at
        const saved = await upsertQuestion(qPayload)
        setQuestion({ ...saved, _key: `dbq-${saved.id}` })
      }

      setToast('Saved successfully!')
      setTimeout(() => setToast(''), 3000)
      // If new, navigate to edit mode
      if (isNew) {
        navigate(`/admin/course/${course.id}`, { replace: true })
      }
    } catch (err) {
      alert('Save failed: ' + (err.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }, [course, lesson, segments, deletedSegmentIds, question, deletedQuestionId, isNew, navigate])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>Loading...</div>
  }

  const ytThumb = lesson.yt_video_id
    ? `https://img.youtube.com/vi/${lesson.yt_video_id}/mqdefault.jpg`
    : null

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <Link to="/admin" style={{ fontSize: 13, color: 'var(--color-grass)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Course List
          </Link>
          <h2 style={{ margin: '8px 0 0', fontSize: 20, color: 'var(--color-title)' }}>
            {isNew ? 'New Course' : `Edit: ${course.title}`}
          </h2>
        </div>
        {toast && (
          <span style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'rgba(111,186,44,0.15)', color: 'var(--color-grass)', fontSize: 13, fontWeight: 600 }}>
            {toast}
          </span>
        )}
      </div>

      {/* ================================================================= */}
      {/* Import Course JSON (bulk paste) */}
      {/* ================================================================= */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#7a4f00' }}>
            ⚡ Import Course from JSON
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: '#a06700' }}>
              Paste a full course payload (course + lesson + segments + question) to fill all fields at once.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            style={{ ...btnStyle, background: '#fff', color: '#7a4f00', border: '1px solid #ffc107', padding: '6px 12px', fontSize: 13 }}
          >
            {showImport ? 'Hide' : 'Show Importer'}
          </button>
        </div>
        {showImport && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={8}
              placeholder='{\n  "course": { "id": "...", "kind": "listening", "title": "...", ... },\n  "lesson": { "yt_video_id": "...", "transcript_en": "...", ... },\n  "segments": [{ "start_sec": 0, "end_sec": 30, "sentence_en": "...", "qtype": "cloze", "blank_word": "...", "distractors": [...] }],\n  "question": { "kind": "mcq", "prompt": "...", "payload": { "options": [...], "correct": 0 } }\n}'
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={handleImportJson}
                style={{ ...btnStyle, background: '#ffa000', color: 'white' }}
              >
                Apply Import
              </button>
              <button
                type="button"
                onClick={() => setImportJson('')}
                style={{ ...btnStyle, background: '#fff', color: '#7a4f00', border: '1px solid #ffc107' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SECTION A: Course Info */}
      {/* ================================================================= */}
      <Section title="Course Info">
        <Row label="ID (kebab-case)">
          <input
            value={course.id} disabled={!isNew}
            onChange={(e) => updateCourse('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="e.g. creeper-sounds-safety"
            style={inputStyle}
          />
        </Row>
        <Row label="Kind">
          <select value={course.kind} onChange={(e) => updateCourse('kind', e.target.value)} style={inputStyle}>
            {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Row>
        <Row label="Title">
          <input value={course.title} onChange={(e) => updateCourse('title', e.target.value)} style={inputStyle} />
        </Row>
        <Row label="Description">
          <textarea value={course.description} onChange={(e) => updateCourse('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Row label="Difficulty (1-3)">
            <select value={course.difficulty} onChange={(e) => updateCourse('difficulty', Number(e.target.value))} style={inputStyle}>
              <option value={1}>1 - Easy</option>
              <option value={2}>2 - Medium</option>
              <option value={3}>3 - Hard</option>
            </select>
          </Row>
          <Row label="Est. Minutes">
            <input type="number" value={course.est_minutes} onChange={(e) => updateCourse('est_minutes', Number(e.target.value))} style={inputStyle} />
          </Row>
          <Row label="XP Reward">
            <input type="number" value={course.xp_reward} onChange={(e) => updateCourse('xp_reward', Number(e.target.value))} style={inputStyle} />
          </Row>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Row label="Unlock Level">
            <input type="number" value={course.unlock_level} onChange={(e) => updateCourse('unlock_level', Number(e.target.value))} style={inputStyle} />
          </Row>
          <Row label="Sort Order">
            <input type="number" value={course.sort_order} onChange={(e) => updateCourse('sort_order', Number(e.target.value))} style={inputStyle} />
          </Row>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Row label="Source Label">
            <input value={course.source_label} onChange={(e) => updateCourse('source_label', e.target.value)} style={inputStyle} />
          </Row>
          <Row label="Source URL">
            <input value={course.source_url || ''} onChange={(e) => updateCourse('source_url', e.target.value)} style={inputStyle} />
          </Row>
          <Row label="License">
            <select value={course.source_license} onChange={(e) => updateCourse('source_license', e.target.value)} style={inputStyle}>
              {LICENSE_OPTIONS.map((l) => <option key={l} value={l}>{l || '(none)'}</option>)}
            </select>
          </Row>
        </div>
        <Row label="Active">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={course.is_active} onChange={(e) => updateCourse('is_active', e.target.checked)} />
            <span style={{ fontSize: 13 }}>{course.is_active ? 'Visible to students' : 'Hidden'}</span>
          </label>
        </Row>
      </Section>

      {/* ================================================================= */}
      {/* SECTION B: Lesson */}
      {/* ================================================================= */}
      <Section title={course.kind === 'reading' ? 'Lesson (Reading Passage)' : 'Lesson (Video Segment)'}>
        <Row label="Lesson ID">
          <input value={lesson.id || `${course.id || '???'}/01`} disabled style={{ ...inputStyle, background: '#f5f5f5' }} />
        </Row>
        <Row label="Lesson Title">
          <input value={lesson.title} onChange={(e) => updateLesson('title', e.target.value)} style={inputStyle} />
        </Row>

        {/* Video-specific fields */}
        {course.kind !== 'reading' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <Row label="YouTube Video ID">
                <input value={lesson.yt_video_id || ''} onChange={(e) => updateLesson('yt_video_id', e.target.value)} placeholder="e.g. dQw4w9WgXcQ" style={inputStyle} />
              </Row>
              {ytThumb && <img src={ytThumb} alt="thumb" style={{ width: 120, borderRadius: 6, marginBottom: 4 }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Row label="Start (sec)">
                <input type="number" value={lesson.yt_start_sec || 0} onChange={(e) => updateLesson('yt_start_sec', Number(e.target.value))} style={inputStyle} />
              </Row>
              <Row label="End (sec)">
                <input type="number" value={lesson.yt_end_sec || 0} onChange={(e) => updateLesson('yt_end_sec', Number(e.target.value))} style={inputStyle} />
              </Row>
              <Row label="XP Reward">
                <input type="number" value={lesson.xp_reward || 0} onChange={(e) => updateLesson('xp_reward', Number(e.target.value))} style={inputStyle} />
              </Row>
            </div>
            <Row label="Transcript (EN)">
              <textarea value={lesson.transcript_en || ''} onChange={(e) => updateLesson('transcript_en', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Row>

            {/* ---- Auto-split VTT (YouTube ASR or plain SRT) ---- */}
            <div style={{ background: '#f6f9ff', border: '1px solid #cfd9ec', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#26416f', marginBottom: 6 }}>
                Paste VTT/SRT → Auto-split Segments
              </div>
              <div style={{ fontSize: 11, color: '#5d6b85', marginBottom: 8 }}>
                Paste YouTube auto-generated VTT (with &lt;hh:mm:ss&gt;&lt;c&gt;word&lt;/c&gt; tags) or plain SRT.
                The parser de-duplicates rolling captions and groups lines into micro-segments.
              </div>
              <textarea
                value={vttPaste}
                onChange={(e) => setVttPaste(e.target.value)}
                placeholder="WEBVTT&#10;&#10;00:00:01.500 --> 00:00:05.000&#10;today<00:00:02.6><c> I</c><00:00:03.6><c> have</c><00:00:04.0><c> bad</c><00:00:04.5><c> news</c>"
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
              />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Min sec
                  <input type="number" min={3} max={120} value={vttMinSec} onChange={(e) => setVttMinSec(Number(e.target.value) || 15)} style={{ width: 56, padding: '2px 6px', fontSize: 12 }} />
                </label>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Max sec
                  <input type="number" min={5} max={180} value={vttMaxSec} onChange={(e) => setVttMaxSec(Number(e.target.value) || 40)} style={{ width: 56, padding: '2px 6px', fontSize: 12 }} />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const txt = (vttPaste || '').trim()
                    if (!txt) { setToast('Paste VTT/SRT text first'); return }
                    let parsed
                    try {
                      parsed = parseYouTubeVtt(txt, { minSec: vttMinSec, maxSec: vttMaxSec })
                    } catch (e) {
                      setToast('Parse error: ' + (e?.message || e)); return
                    }
                    if (!parsed.segments.length) { setToast('No segments parsed'); return }
                    if (segments.length > 0 && !window.confirm(`This will replace ${segments.length} existing segments with ${parsed.segments.length} parsed segments. Continue?`)) return
                    const lessonId = lesson.id || `${course.id || '???'}/01`
                    const newSegs = parsed.segments.map((p, i) => ({
                      ...emptySegment(i, lessonId, false),
                      start_sec: p.start,
                      end_sec: p.end,
                      sentence_en: p.sentence_en,
                      _key: `vtt-${Date.now()}-${i}`,
                    }))
                    setSegments(newSegs)
                    // Auto-fill lesson-level fields
                    const fullText = parsed.lines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim()
                    setLesson((prev) => ({
                      ...prev,
                      yt_start_sec: parsed.segments[0].start,
                      yt_end_sec: parsed.segments[parsed.segments.length - 1].end,
                      transcript_en: prev.transcript_en?.trim() ? prev.transcript_en : fullText,
                    }))
                    setToast(`Auto-split: ${parsed.segments.length} segments (${parsed.lines.length} lines)`)
                  }}
                  style={{ ...btnStyle, background: '#4a90d9', color: 'white' }}
                >
                  Auto-split VTT → Segments
                </button>
                {vttPaste && (
                  <button
                    type="button"
                    onClick={() => setVttPaste('')}
                    style={{ ...btnStyle, background: '#eef2f8', color: '#26416f' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Reading-specific fields */}
        {course.kind === 'reading' && (
          <>
            <Row label="XP Reward">
              <input type="number" value={lesson.xp_reward || 0} onChange={(e) => updateLesson('xp_reward', Number(e.target.value))} style={inputStyle} />
            </Row>
            <Row label="Full Passage (Markdown) — for reference / legacy mode">
              <textarea value={lesson.passage_md || ''} onChange={(e) => updateLesson('passage_md', e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            </Row>
            {lesson.passage_md && (
              <button
                onClick={() => {
                  const paras = (lesson.passage_md || '').trim().split(/\n{2,}/).filter(Boolean)
                  if (paras.length === 0) return
                  if (segments.length > 0 && !window.confirm(`This will replace ${segments.length} existing segments with ${paras.length} paragraphs. Continue?`)) return
                  const lessonId = lesson.id || `${course.id}/01`
                  const newSegs = paras.map((p, i) => ({
                    ...emptySegment(i, lessonId, true),
                    sentence_en: p.trim(),
                    _key: `split-${Date.now()}-${i}`,
                  }))
                  setSegments(newSegs)
                }}
                style={{ ...btnStyle, background: '#4a90d9', color: 'white', marginBottom: 8 }}
              >
                Auto-split Passage → Segments
              </button>
            )}
          </>
        )}

        <Row label="Translation (ZH)">
          <textarea value={lesson.transcript_zh || ''} onChange={(e) => updateLesson('transcript_zh', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Row>
        <Row label="Highlight Words">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {(lesson.highlight_words || []).map((w, i) => (
              <span key={i} style={{ padding: '3px 8px', background: 'var(--color-grass-wash)', borderRadius: 12, fontSize: 12, color: 'var(--color-grass-active)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {w}
                <button onClick={() => updateLesson('highlight_words', lesson.highlight_words.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#c13c3c', fontSize: 14, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && highlightInput.trim()) {
                  updateLesson('highlight_words', [...(lesson.highlight_words || []), highlightInput.trim().toLowerCase()])
                  setHighlightInput('')
                  e.preventDefault()
                }
              }}
              placeholder="Type word + Enter"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </Row>
      </Section>

      {/* ================================================================= */}
      {/* SECTION C: Segments */}
      {/* ================================================================= */}
      <Section title={`${course.kind === 'reading' ? 'Paragraphs' : 'Segments'} (${segments.length})`}>
        {segments.map((seg, idx) => (
          <SegmentCard
            key={seg._key || seg.id || idx}
            seg={seg}
            index={idx}
            isReading={course.kind === 'reading'}
            onUpdate={updateSegment}
            onUpdatePayload={updateSegmentPayload}
            onRemove={() => removeSegment(idx)}
          />
        ))}
        <button onClick={addSegment} style={{ ...btnStyle, background: 'var(--color-grass)', color: 'white', marginTop: 8 }}>
          + Add Segment
        </button>
      </Section>

      {/* ================================================================= */}
      {/* SECTION D: Cooldown Question */}
      {/* ================================================================= */}
      <Section title="Cooldown Question (MCQ)">
        {question ? (
          <QuestionCard
            question={question}
            onUpdate={updateQuestion}
            onUpdatePayload={updateQuestionPayload}
            onRemove={removeQuestion}
          />
        ) : (
          <button onClick={addQuestion} style={{ ...btnStyle, background: '#4a90d9', color: 'white' }}>
            + Add Cooldown Question
          </button>
        )}
      </Section>

      {/* ================================================================= */}
      {/* Bottom action bar */}
      {/* ================================================================= */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingBottom: 60 }}>
        <button onClick={() => navigate('/admin')} style={{ ...btnStyle, background: '#eee', color: '#555' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: 'var(--color-grass)', color: 'white', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Sub-components
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
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// -- Segment Card
function SegmentCard({ seg, index, isReading, onUpdate, onUpdatePayload, onRemove }) {
  const qtype = seg.qtype || (isReading ? 'vocabulary_cloze' : 'cloze')
  const payload = seg.quiz_payload || {}
  const qtypeOptions = isReading ? QTYPE_OPTIONS_READING : QTYPE_OPTIONS_LISTENING

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', marginBottom: 10, background: 'rgba(0,0,0,0.01)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          {isReading ? `Paragraph #${index + 1}` : `Segment #${index + 1}`}
        </span>
        <button onClick={onRemove} style={{ border: 'none', background: 'none', color: '#e05a5a', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
      </div>

      {/* Time fields only for listening */}
      {!isReading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Row label="Start (sec)">
            <input type="number" step="0.1" value={seg.start_sec} onChange={(e) => onUpdate(index, 'start_sec', Number(e.target.value))} style={inputStyle} />
          </Row>
          <Row label="End (sec)">
            <input type="number" step="0.1" value={seg.end_sec} onChange={(e) => onUpdate(index, 'end_sec', Number(e.target.value))} style={inputStyle} />
          </Row>
          <Row label="Q-Type">
            <select value={qtype} onChange={(e) => onUpdate(index, 'qtype', e.target.value)} style={inputStyle}>
              {qtypeOptions.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </Row>
        </div>
      )}

      {/* Reading: qtype selector at top */}
      {isReading && (
        <Row label="Quiz Type">
          <select value={qtype} onChange={(e) => onUpdate(index, 'qtype', e.target.value)} style={inputStyle}>
            {qtypeOptions.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </Row>
      )}

      <Row label={isReading ? 'Paragraph Text (EN)' : 'Sentence (EN)'}>
        {isReading ? (
          <textarea value={seg.sentence_en} onChange={(e) => onUpdate(index, 'sentence_en', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        ) : (
          <input value={seg.sentence_en} onChange={(e) => onUpdate(index, 'sentence_en', e.target.value)} style={inputStyle} />
        )}
      </Row>
      <Row label={isReading ? 'Translation (ZH)' : 'Sentence (ZH)'}>
        {isReading ? (
          <textarea value={seg.sentence_zh || ''} onChange={(e) => onUpdate(index, 'sentence_zh', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        ) : (
          <input value={seg.sentence_zh || ''} onChange={(e) => onUpdate(index, 'sentence_zh', e.target.value)} style={inputStyle} />
        )}
      </Row>

      {/* qtype-specific fields */}
      {(qtype === 'cloze' || qtype === 'vocabulary_cloze') && (
        <>
          <Row label="Blank Word">
            <input value={seg.blank_word || ''} onChange={(e) => onUpdate(index, 'blank_word', e.target.value)} placeholder="leave empty for auto-pick" style={inputStyle} />
          </Row>
          <Row label="Distractors (comma-separated)">
            <input
              value={(seg.distractors || []).join(', ')}
              onChange={(e) => onUpdate(index, 'distractors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="word1, word2, word3"
              style={inputStyle}
            />
          </Row>
        </>
      )}

      {(qtype === 'comprehension' || qtype === 'detail_mcq' || qtype === 'speaker_intent') && (
        <MCQPayloadEditor payload={payload} onUpdate={(f, v) => onUpdatePayload(index, f, v)} />
      )}

      {qtype === 'true_false' && (
        <>
          <Row label="Statement">
            <input value={payload.statement || ''} onChange={(e) => onUpdatePayload(index, 'statement', e.target.value)} style={inputStyle} />
          </Row>
          <Row label="Correct Answer">
            <select value={payload.correct === true || payload.correct === 'true' ? 'true' : 'false'} onChange={(e) => onUpdatePayload(index, 'correct', e.target.value === 'true')} style={inputStyle}>
              <option value="true">TRUE</option>
              <option value="false">FALSE</option>
            </select>
          </Row>
        </>
      )}

      {qtype === 'sound_match' && (
        <MCQPayloadEditor payload={payload} onUpdate={(f, v) => onUpdatePayload(index, f, v)} />
      )}

      {qtype === 'phonetic_pair' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Row label="Word A">
              <input value={(payload.pair || [])[0] || ''} onChange={(e) => onUpdatePayload(index, 'pair', [e.target.value, (payload.pair || [])[1] || ''])} style={inputStyle} />
            </Row>
            <Row label="Word B">
              <input value={(payload.pair || [])[1] || ''} onChange={(e) => onUpdatePayload(index, 'pair', [(payload.pair || [])[0] || '', e.target.value])} style={inputStyle} />
            </Row>
            <Row label="Correct (0=A, 1=B)">
              <select value={payload.correct || 0} onChange={(e) => onUpdatePayload(index, 'correct', Number(e.target.value))} style={inputStyle}>
                <option value={0}>0 (Word A)</option>
                <option value={1}>1 (Word B)</option>
              </select>
            </Row>
          </div>
        </>
      )}

      {qtype === 'word_match' && (
        <WordMatchPayloadEditor payload={payload} onUpdate={(f, v) => onUpdatePayload(index, f, v)} />
      )}

      {qtype === 'sentence_order' && (
        <SentenceOrderPayloadEditor payload={payload} onUpdate={(f, v) => onUpdatePayload(index, f, v)} />
      )}
    </div>
  )
}

// -- MCQ Payload Editor (for comprehension / detail_mcq / speaker_intent / sound_match)
function MCQPayloadEditor({ payload, onUpdate }) {
  const options = payload.options || ['', '', '', '']

  function setOption(idx, val) {
    const next = [...options]
    next[idx] = val
    onUpdate('options', next)
  }

  function addOption() {
    onUpdate('options', [...options, ''])
  }

  function removeOption(idx) {
    const next = options.filter((_, i) => i !== idx)
    onUpdate('options', next)
    // Adjust correct index if needed
    if ((payload.correct || 0) >= next.length) {
      onUpdate('correct', Math.max(0, next.length - 1))
    }
  }

  return (
    <>
      <Row label="Prompt">
        <input value={payload.prompt || ''} onChange={(e) => onUpdate('prompt', e.target.value)} placeholder="What did you hear?" style={inputStyle} />
      </Row>
      <Row label="Options">
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, width: 16, color: 'var(--color-muted)', fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
            <input value={opt} onChange={(e) => setOption(i, e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} style={{ border: 'none', background: 'none', color: '#e05a5a', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addOption} style={{ fontSize: 12, border: 'none', background: 'none', color: 'var(--color-grass)', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
          + Add Option
        </button>
      </Row>
      <Row label="Correct Answer Index">
        <select value={payload.correct || 0} onChange={(e) => onUpdate('correct', Number(e.target.value))} style={inputStyle}>
          {options.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)} (index {i})</option>)}
        </select>
      </Row>
    </>
  )
}

// -- Question Card (Cooldown MCQ)
function QuestionCard({ question, onUpdate, onUpdatePayload, onRemove }) {
  const options = question.payload?.options || ['', '', '', '']

  function setOption(idx, val) {
    const next = [...options]
    next[idx] = val
    onUpdatePayload('options', next)
  }

  function addOption() {
    onUpdatePayload('options', [...options, ''])
  }

  function removeOption(idx) {
    const next = options.filter((_, i) => i !== idx)
    onUpdatePayload('options', next)
    if ((question.payload?.correct || 0) >= next.length) {
      onUpdatePayload('correct', Math.max(0, next.length - 1))
    }
  }

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', background: 'rgba(0,0,0,0.01)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Cooldown MCQ</span>
        <button onClick={onRemove} style={{ border: 'none', background: 'none', color: '#e05a5a', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
      </div>
      <Row label="Prompt">
        <input value={question.prompt || ''} onChange={(e) => onUpdate('prompt', e.target.value)} style={inputStyle} />
      </Row>
      <Row label="Options">
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, width: 16, color: 'var(--color-muted)', fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
            <input value={opt} onChange={(e) => setOption(i, e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} style={{ border: 'none', background: 'none', color: '#e05a5a', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addOption} style={{ fontSize: 12, border: 'none', background: 'none', color: 'var(--color-grass)', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
          + Add Option
        </button>
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Row label="Correct Answer">
          <select value={question.payload?.correct || 0} onChange={(e) => onUpdatePayload('correct', Number(e.target.value))} style={inputStyle}>
            {options.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
          </select>
        </Row>
        <Row label="XP Reward">
          <input type="number" value={question.xp_reward || 5} onChange={(e) => onUpdate('xp_reward', Number(e.target.value))} style={inputStyle} />
        </Row>
      </div>
    </div>
  )
}

// -- Word Match Payload Editor
function WordMatchPayloadEditor({ payload, onUpdate }) {
  const pairs = Array.isArray(payload.pairs) ? payload.pairs : [{ word: '', definition: '' }]

  function setPair(idx, field, val) {
    const next = pairs.map((p, i) => i === idx ? { ...p, [field]: val } : p)
    onUpdate('pairs', next)
  }

  function addPair() {
    onUpdate('pairs', [...pairs, { word: '', definition: '' }])
  }

  function removePair(idx) {
    onUpdate('pairs', pairs.filter((_, i) => i !== idx))
  }

  return (
    <>
      <Row label="Word-Definition Pairs">
        {pairs.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <input value={p.word} onChange={(e) => setPair(i, 'word', e.target.value)} placeholder="word" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>=</span>
            <input value={p.definition} onChange={(e) => setPair(i, 'definition', e.target.value)} placeholder="definition" style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
            {pairs.length > 1 && (
              <button onClick={() => removePair(i)} style={{ border: 'none', background: 'none', color: '#e05a5a', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addPair} style={{ fontSize: 12, border: 'none', background: 'none', color: 'var(--color-grass)', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
          + Add Pair
        </button>
      </Row>
    </>
  )
}

// -- Sentence Order Payload Editor
function SentenceOrderPayloadEditor({ payload, onUpdate }) {
  const sentences = Array.isArray(payload.sentences) ? payload.sentences : ['']

  function setSentence(idx, val) {
    const next = sentences.map((s, i) => i === idx ? val : s)
    onUpdate('sentences', next)
    // Auto-set correct_order as the current order [0,1,2,...]
    onUpdate('correct_order', next.map((_, i) => i))
  }

  function addSentence() {
    const next = [...sentences, '']
    onUpdate('sentences', next)
    onUpdate('correct_order', next.map((_, i) => i))
  }

  function removeSentence(idx) {
    const next = sentences.filter((_, i) => i !== idx)
    onUpdate('sentences', next)
    onUpdate('correct_order', next.map((_, i) => i))
  }

  return (
    <>
      <Row label="Sentences (in CORRECT order — they will be shuffled for the student)">
        {sentences.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, width: 16, color: 'var(--color-muted)', fontWeight: 700 }}>{i + 1}</span>
            <input value={s} onChange={(e) => setSentence(i, e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            {sentences.length > 1 && (
              <button onClick={() => removeSentence(i)} style={{ border: 'none', background: 'none', color: '#e05a5a', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addSentence} style={{ fontSize: 12, border: 'none', background: 'none', color: 'var(--color-grass)', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
          + Add Sentence
        </button>
      </Row>
    </>
  )
}

// -- Shared styles
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 13,
  fontFamily: 'var(--font-body)', boxSizing: 'border-box',
}

const btnStyle = {
  padding: '10px 20px', borderRadius: 'var(--radius-pill)',
  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}
