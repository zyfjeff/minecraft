// =============================================================================
// ReadingPractice — Segmented reading lesson with progressive unlock.
//
// When a lesson has segments (lesson_segments rows), the reader works through
// one paragraph at a time: read → quiz → unlock translation + next paragraph.
// When no segments exist, falls back to the legacy full-passage layout.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  listLessonsForCourse,
  listQuestionsForLesson,
  fetchLessonSegments,
  saveSegmentAttempt,
  saveLessonReport,
} from '../lib/courses'
import VocabPopover from '../components/VocabPopover'
import ReadingQuiz from '../components/ReadingQuiz'
import ReadingReport from '../components/ReadingReport'
import {
  HeartsDisplay,
  SegmentProgress as SharedSegmentProgress,
} from '../components/PracticeShell'

// ---------------------------------------------------------------------------
// Helpers — lightweight markdown for short passages
// ---------------------------------------------------------------------------
function renderMarkdown(text, highlightSet, vocabMap, onWordClick) {
  if (!text) return null
  const paragraphs = text.trim().split(/\n{2,}/)
  return paragraphs.map((para, pi) => (
    <p key={pi} style={{ marginBottom: 'var(--space-md)' }}>
      {tokenizeLine(para, highlightSet, vocabMap, onWordClick)}
    </p>
  ))
}

function tokenizeLine(line, highlightSet, vocabMap, onWordClick) {
  const linkParts = []
  let cursor = 0
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let m
  while ((m = linkRe.exec(line)) !== null) {
    if (m.index > cursor) linkParts.push({ type: 'text', value: line.slice(cursor, m.index) })
    linkParts.push({ type: 'link', text: m[1], href: m[2] })
    cursor = m.index + m[0].length
  }
  if (cursor < line.length) linkParts.push({ type: 'text', value: line.slice(cursor) })
  return linkParts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <a key={`l${i}`} href={part.href} target="_blank" rel="noreferrer"
          style={{ color: 'var(--color-grass-active)', textDecoration: 'underline' }}>
          {part.text}
        </a>
      )
    }
    return renderWithMarks(part.value, `t${i}`, highlightSet, vocabMap, onWordClick)
  })
}

function renderWithMarks(text, kp, highlightSet, vocabMap, onWordClick) {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
  return parts.map((seg, idx) => {
    const k = `${kp}-${idx}`
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={k} style={{ color: 'var(--color-title)' }}>{highlightWords(seg.slice(2, -2), k, highlightSet, vocabMap, onWordClick)}</strong>
    }
    if (seg.startsWith('_') && seg.endsWith('_')) {
      return <em key={k} style={{ color: 'var(--color-muted)' }}>{highlightWords(seg.slice(1, -1), k, highlightSet, vocabMap, onWordClick)}</em>
    }
    return highlightWords(seg, k, highlightSet, vocabMap, onWordClick)
  })
}

function highlightWords(text, kp, highlightSet, vocabMap, onWordClick) {
  if (!text) return null
  const tokens = text.split(/(\s+)/)
  return tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return tok
    const stripped = tok.replace(/[^A-Za-z']/g, '').toLowerCase()
    if (stripped && highlightSet.has(stripped)) {
      const entry = vocabMap?.[stripped]
      return (
        <span key={`${kp}-${i}`} onClick={() => onWordClick?.(stripped, entry)}
          style={{
            color: 'var(--color-grass-active)', fontWeight: 600, cursor: 'pointer',
            borderBottom: '2px dashed var(--color-grass)', padding: '0 2px', borderRadius: 2,
          }}>
          {tok}
        </span>
      )
    }
    return <span key={`${kp}-${i}`}>{tok}</span>
  })
}

// ---------------------------------------------------------------------------
// Hearts display & progress bar — 通过 PracticeShell 统一实现。
// 保留同名本地包装以避免散落处的引用变化。
// ---------------------------------------------------------------------------
function Hearts({ count, max = 3 }) {
  return <HeartsDisplay count={count} max={max} variant="emoji" />
}

function SegmentProgress({ current, total }) {
  return <SharedSegmentProgress current={current} total={total} />
}

// =============================================================================
// Main component
// =============================================================================
export default function ReadingPractice() {
  const { id: courseId } = useParams()
  const {
    courses, coursesLoaded, userCourseProgress, vocabMap,
    markLessonComplete, submitAnswer,
  } = useAuth()
  const authUser = useAuth().authUser

  const course = useMemo(() => (courses || []).find(c => c.id === courseId) || null, [courses, courseId])

  // Data loading
  const [lesson, setLesson] = useState(null)
  const [segments, setSegments] = useState([])
  const [questions, setQuestions] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const startTimeRef = useRef(Date.now())

  // Segmented reading state
  const [currentSegIdx, setCurrentSegIdx] = useState(0)
  const [unlockedUpTo, setUnlockedUpTo] = useState(0) // segments answered up to this index
  const [hearts, setHearts] = useState(3)
  const [segResults, setSegResults] = useState([]) // { segId, qtype, isCorrect, blankWord }
  const [phase, setPhase] = useState('reading') // reading | quiz | done | cooldown | report

  // Cooldown question state
  const [cooldownAnswered, setCooldownAnswered] = useState(false)
  const [cooldownCorrect, setCooldownCorrect] = useState(false)

  // Legacy mode state (no segments)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  // Vocab popover
  const [popoverWord, setPopoverWord] = useState(null)

  const hasSegments = segments.length > 0

  // -------------------------------------------------------------------------
  // Load lesson + segments + questions
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    if (!courseId) return
    setLoaded(false); setLoadError(null); setLesson(null)
    setSegments([]); setQuestions([]); setAnswers({})
    setSubmitted(false); setSubmitResult(null)
    setCurrentSegIdx(0); setUnlockedUpTo(0); setHearts(3)
    setSegResults([]); setPhase('reading')
    setCooldownAnswered(false); setCooldownCorrect(false)
    startTimeRef.current = Date.now()
    ;(async () => {
      try {
        const lessons = await listLessonsForCourse(courseId)
        const first = (lessons || []).find(l => l.kind === 'reading_passage') || null
        if (cancelled) return
        setLesson(first)
        if (first) {
          const [segs, qs] = await Promise.all([
            fetchLessonSegments(first.id),
            listQuestionsForLesson(first.id),
          ])
          if (cancelled) return
          setSegments(segs || [])
          setQuestions(qs || [])
        }
      } catch (err) {
        if (!cancelled) setLoadError(err)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [courseId])

  const highlightSet = useMemo(
    () => new Set((lesson?.highlight_words || []).map(w => String(w).toLowerCase())),
    [lesson?.highlight_words],
  )

  const progressRow = courseId ? (userCourseProgress?.[courseId] || null) : null
  const lessonAlreadyDone = !!(lesson && progressRow?.completed_lesson_ids?.includes(lesson.id))

  // Current segment
  const currentSeg = hasSegments ? segments[currentSegIdx] : null
  const cooldownQ = useMemo(() => (questions || []).find(q => q.kind === 'mcq') || null, [questions])

  // -------------------------------------------------------------------------
  // Segmented mode handlers
  // -------------------------------------------------------------------------
  function handleReadyForQuiz() {
    setPhase('quiz')
  }

  function handleQuizAnswer(isCorrect) {
    const seg = segments[currentSegIdx]
    setSegResults(prev => [...prev, {
      segId: seg.id, qtype: seg.qtype, isCorrect,
      blankWord: seg.blank_word || null,
    }])

    // Save attempt to DB
    if (authUser) {
      saveSegmentAttempt({
        userId: authUser.id, segmentId: seg.id,
        choice: '', isCorrect, heartsLeftAfter: isCorrect ? hearts : hearts - 1,
        qtype: seg.qtype || 'comprehension',
      })
    }

    if (!isCorrect) {
      setHearts(prev => Math.max(0, prev - 1))
    }

    // Unlock this segment's translation
    setUnlockedUpTo(currentSegIdx + 1)

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentSegIdx < segments.length - 1) {
        setCurrentSegIdx(prev => prev + 1)
        setPhase('reading')
      } else {
        // All segments done
        if (cooldownQ) {
          setPhase('cooldown')
        } else {
          finishLesson()
        }
      }
    }, 1200)
  }

  function handleCooldownAnswer(isCorrect) {
    setCooldownAnswered(true)
    setCooldownCorrect(isCorrect)
    if (!isCorrect) setHearts(prev => Math.max(0, prev - 1))
    if (authUser && cooldownQ) {
      submitAnswer(courseId, cooldownQ, isCorrect)
    }
    setTimeout(() => finishLesson(), 1000)
  }

  async function finishLesson() {
    setPhase('report')
    if (!lesson || !authUser) return
    const xpReward = Number(lesson.xp_reward) || 0
    await markLessonComplete(courseId, lesson)
    // Persist report
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    const correctCount = segResults.filter(r => r.isCorrect).length + (cooldownCorrect ? 1 : 0)
    const totalSegs = segments.length + (cooldownQ ? 1 : 0)
    const perQtype = {}
    for (const r of segResults) {
      if (!perQtype[r.qtype]) perQtype[r.qtype] = { total: 0, correct: 0 }
      perQtype[r.qtype].total += 1
      if (r.isCorrect) perQtype[r.qtype].correct += 1
    }
    saveLessonReport({
      userId: authUser.id, lessonId: lesson.id,
      totalSegments: totalSegs, correctCount,
      perQtypeScores: perQtype,
      weakAreas: segResults.filter(r => !r.isCorrect).map(r => r.blankWord).filter(Boolean),
      heartsRemaining: hearts, timeSpentSec: timeSpent,
    })
  }

  // Build scores for report
  const reportScores = useMemo(() => {
    const scores = {}
    for (const r of segResults) {
      if (!scores[r.qtype]) scores[r.qtype] = { total: 0, correct: 0 }
      scores[r.qtype].total += 1
      if (r.isCorrect) scores[r.qtype].correct += 1
    }
    return scores
  }, [segResults])

  const weakWords = useMemo(
    () => segResults.filter(r => !r.isCorrect && r.blankWord).map(r => r.blankWord),
    [segResults],
  )

  const xpAwarded = Number(lesson?.xp_reward) || 0

  // -------------------------------------------------------------------------
  // Legacy mode handlers (no segments)
  // -------------------------------------------------------------------------
  const renderableQuestions = useMemo(
    () => (questions || []).filter(q => q.kind === 'mcq').map(q => {
      const payload = q.payload || {}
      return {
        id: q.id, prompt: q.prompt, xp_reward: q.xp_reward,
        options: Array.isArray(payload.options) ? payload.options : [],
        correctIndex: Number.isInteger(payload.correct) ? payload.correct : -1,
        raw: q,
      }
    }),
    [questions],
  )

  function handlePick(qId, optIdx) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
  }

  async function handleSubmitLegacy() {
    if (submitted || renderableQuestions.length === 0) return
    setSubmitted(true)
    let correctCount = 0
    let xpAw = 0
    for (const q of renderableQuestions) {
      const picked = answers[q.id]
      const isCorrect = picked === q.correctIndex
      if (isCorrect) correctCount += 1
      const res = await submitAnswer(courseId, q.raw, isCorrect)
      if (isCorrect && res?.ok && !res.alreadyAnswered) xpAw += res.xpAwarded || 0
    }
    let lessonXp = 0
    if (correctCount === renderableQuestions.length && lesson) {
      const lc = await markLessonComplete(courseId, lesson)
      if (lc?.ok && !lc.alreadyCompleted) lessonXp = lc.xpAwarded || 0
    }
    setSubmitResult({ correctCount, totalQs: renderableQuestions.length, xpAwarded: xpAw, lessonXp })
  }

  function handleWordClick(word, entry) {
    setPopoverWord({ word, entry })
  }

  const difficulty = course?.difficulty || 1

  // =========================================================================
  // RENDER — Segmented mode
  // =========================================================================
  if (loaded && hasSegments) {
    return (
      <div data-component="reading-practice-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 640, margin: '0 auto' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Link to="/courses" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-grass)', fontWeight: 600, fontSize: 14 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            Back
          </Link>
          {phase !== 'report' && (
            <>
              <SegmentProgress current={unlockedUpTo} total={segments.length} />
              <Hearts count={hearts} />
            </>
          )}
        </div>

        {/* Title */}
        {phase !== 'report' && (
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'var(--tile-green)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                📖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  READING PRACTICE
                </span>
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  {lesson?.title || course?.title || 'Reading'}
                </h2>
              </div>
              {lessonAlreadyDone && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-success)',
                  background: 'rgba(111,186,44,0.12)', padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                }}>
                  Completed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Unlocked paragraphs (already answered) */}
        {phase !== 'report' && unlockedUpTo > 0 && (
          <div className="card" style={{ background: 'var(--color-surface-soft)' }}>
            {segments.slice(0, unlockedUpTo).map((seg, i) => (
              <div key={seg.id || i} style={{ marginBottom: i < unlockedUpTo - 1 ? 'var(--space-md)' : 0 }}>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-body)' }}>
                  {renderMarkdown(seg.sentence_en, highlightSet, vocabMap, handleWordClick)}
                </div>
                {seg.sentence_zh && (
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic', marginTop: 4, marginBottom: 0 }}>
                    {seg.sentence_zh}
                  </p>
                )}
                {i < unlockedUpTo - 1 && (
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--color-disabled)', margin: 'var(--space-md) 0' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Current paragraph — reading phase */}
        {phase === 'reading' && currentSeg && (
          <div className="card" style={{ border: '2px solid var(--color-grass)', position: 'relative' }}>
            <span style={{
              position: 'absolute', top: -10, left: 16,
              background: 'var(--color-grass)', color: 'white',
              fontSize: 10, fontWeight: 700, padding: '2px 10px',
              borderRadius: 'var(--radius-pill)', textTransform: 'uppercase',
            }}>
              Paragraph {currentSegIdx + 1}
            </span>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-body)', marginTop: 'var(--space-sm)' }}>
              {renderMarkdown(currentSeg.sentence_en, highlightSet, vocabMap, handleWordClick)}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleReadyForQuiz}
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
            >
              I'm ready — Quiz me!
            </button>
          </div>
        )}

        {/* Quiz phase */}
        {phase === 'quiz' && currentSeg && (
          <ReadingQuiz
            segment={currentSeg}
            onAnswer={handleQuizAnswer}
            disabled={false}
          />
        )}

        {/* Cooldown question */}
        {phase === 'cooldown' && cooldownQ && (
          <div className="card">
            <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-title)' }}>
              Final Question
            </h4>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              {cooldownQ.prompt}
            </p>
            <CooldownMCQ question={cooldownQ} onAnswer={handleCooldownAnswer} answered={cooldownAnswered} />
          </div>
        )}

        {/* Report phase */}
        {phase === 'report' && (
          <>
            <ReadingReport
              scores={reportScores}
              heartsLeft={hearts}
              timeSpentSec={Math.round((Date.now() - startTimeRef.current) / 1000)}
              xpAwarded={lessonAlreadyDone ? 0 : xpAwarded}
              lessonTitle={lesson?.title || course?.title}
              weakWords={weakWords}
            />
            <Link to="/courses" className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Back to Courses
            </Link>
          </>
        )}

        {/* Source attribution */}
        {course?.source_label && phase !== 'report' && (
          <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
            Excerpt courtesy of{' '}
            {course.source_url
              ? <a href={course.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-muted)' }}>{course.source_label}</a>
              : course.source_label}
            {course.source_license ? ` · ${course.source_license}` : ''}
          </p>
        )}

        {popoverWord && (
          <VocabPopover word={popoverWord.word} entry={popoverWord.entry} onClose={() => setPopoverWord(null)} />
        )}
      </div>
    )
  }

  // =========================================================================
  // RENDER — Legacy mode (no segments) — keep existing behavior
  // =========================================================================
  return (
    <div data-component="reading-practice-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Link to="/courses" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-grass)', fontWeight: 600, fontSize: 14 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          Back to Courses
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Difficulty:</span>
          <div className="stars">
            {[1, 2, 3].map(s => (
              <svg key={s} className={`star ${s <= difficulty ? 'star-filled' : 'star-empty'}`} width="14" height="14" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Left: passage + word bank */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'var(--tile-green)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                📖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  READING PRACTICE
                </span>
                <h2 style={{ fontSize: 20, margin: 0 }}>
                  {lesson?.title || course?.title || 'Reading'}
                </h2>
              </div>
              {lessonAlreadyDone && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-success)',
                  background: 'rgba(111,186,44,0.12)', padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                }}>
                  Completed
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-body)', maxWidth: '60ch' }}>
              {!loaded ? (
                <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading passage...</p>
              ) : !lesson?.passage_md ? (
                <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
                  {loadError ? `Could not load passage: ${loadError.message}` : 'No reading passage published for this course yet.'}
                </p>
              ) : (
                renderMarkdown(lesson.passage_md, highlightSet, vocabMap, handleWordClick)
              )}
            </div>
            {lesson?.transcript_zh && (
              <details style={{ marginTop: 'var(--space-md)' }}>
                <summary style={{ fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer', fontWeight: 600 }}>
                  Show 中文 translation
                </summary>
                <p style={{ marginTop: 'var(--space-sm)', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                  {lesson.transcript_zh}
                </p>
              </details>
            )}
          </div>

          {/* Word Bank */}
          {(lesson?.highlight_words || []).length > 0 && (
            <div className="card-flat" style={{ background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-gold)"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                <h4 style={{ fontSize: 14, margin: 0 }}>Word Bank</h4>
                <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}>Tap a word to see its meaning</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {lesson.highlight_words.map(word => {
                  const entry = vocabMap?.[String(word).toLowerCase()]
                  return (
                    <div key={word} onClick={() => handleWordClick(word, entry)}
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-pill)',
                        background: 'var(--color-surface)', color: 'var(--color-body)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        border: '1px solid var(--color-disabled)',
                      }}>
                      <span>{word}</span>
                      {entry?.definition_zh && (
                        <span style={{ fontSize: 11, opacity: 0.7 }}>({entry.definition_zh.split('；')[0].slice(0, 12)})</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right: questions */}
        <section>
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <h4 style={{ marginBottom: 'var(--space-lg)' }}>Comprehension Check</h4>
            {!loaded ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading questions...</p>
            ) : renderableQuestions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No questions yet.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  {renderableQuestions.map((q, qi) => (
                    <div key={q.id} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--color-cream)' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-title)', marginBottom: 'var(--space-md)' }}>
                        <span style={{ color: 'var(--color-muted)', marginRight: 6 }}>{qi + 1}.</span>
                        {q.prompt}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {q.options.map((opt, oi) => {
                          const picked = answers[q.id] === oi
                          const isAnswer = oi === q.correctIndex
                          const wrongPick = submitted && picked && !isAnswer
                          const borderColor = submitted && isAnswer ? 'var(--color-success)' : wrongPick ? 'var(--color-danger)' : picked ? 'var(--color-grass)' : 'var(--color-disabled)'
                          const bg = submitted && isAnswer ? 'rgba(111,186,44,0.08)' : wrongPick ? 'rgba(224,90,90,0.08)' : picked ? 'var(--color-grass-wash)' : 'white'
                          return (
                            <button key={oi} onClick={() => handlePick(q.id, oi)} disabled={submitted}
                              style={{
                                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${borderColor}`, background: bg,
                                textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                                fontSize: 13, fontWeight: 500, color: 'var(--color-body)',
                                fontFamily: 'var(--font-body)',
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                              }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                border: `2px solid ${picked ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700,
                              }}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  {!submitted ? (
                    <button className="btn btn-primary" onClick={handleSubmitLegacy}
                      disabled={Object.keys(answers).length < renderableQuestions.length}
                      style={{ width: '100%' }}>
                      Check Answers
                    </button>
                  ) : submitResult ? (
                    <div style={{
                      padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                      background: submitResult.correctCount === submitResult.totalQs ? 'rgba(111,186,44,0.1)' : 'rgba(244,180,0,0.12)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 20, fontWeight: 800,
                        color: submitResult.correctCount === submitResult.totalQs ? 'var(--color-success)' : 'var(--color-gold)',
                        fontFamily: 'var(--font-display)',
                      }}>
                        {submitResult.correctCount}/{submitResult.totalQs} Correct
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
                        {submitResult.xpAwarded + submitResult.lessonXp > 0
                          ? `+${submitResult.xpAwarded + submitResult.lessonXp} XP earned`
                          : 'No XP this round (already completed).'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Source attribution */}
      {course?.source_label && (
        <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', marginTop: 'var(--space-md)' }}>
          Excerpt courtesy of{' '}
          {course.source_url
            ? <a href={course.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-muted)' }}>{course.source_label}</a>
            : course.source_label}
          {course.source_license ? ` · ${course.source_license}` : ''}
        </p>
      )}

      {!coursesLoaded ? null : !course ? (
        <p style={{ fontSize: 13, color: 'var(--color-danger)', textAlign: 'center' }}>
          Course "{courseId}" not found. <Link to="/courses" style={{ color: 'var(--color-grass)' }}>Back to courses</Link>
        </p>
      ) : null}

      {popoverWord && (
        <VocabPopover word={popoverWord.word} entry={popoverWord.entry} onClose={() => setPopoverWord(null)} />
      )}
    </div>
  )
}

// =============================================================================
// CooldownMCQ — simple MCQ for the final question
// =============================================================================
function CooldownMCQ({ question, onAnswer, answered }) {
  const [picked, setPicked] = useState(null)
  const payload = question.payload || {}
  const options = Array.isArray(payload.options) ? payload.options : []
  const correctIdx = typeof payload.correct === 'number' ? payload.correct : 0

  function handlePick(idx) {
    if (answered) return
    setPicked(idx)
  }

  function handleSubmit() {
    if (picked === null || answered) return
    onAnswer(picked === correctIdx)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {options.map((opt, i) => {
        const isSelected = picked === i
        const isCorrect = answered && i === correctIdx
        const isWrong = answered && isSelected && i !== correctIdx
        return (
          <button key={i} onClick={() => handlePick(i)} disabled={answered}
            style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              border: `2px solid ${isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-danger)' : isSelected ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
              background: isCorrect ? 'rgba(111,186,44,0.08)' : isWrong ? 'rgba(224,90,90,0.08)' : isSelected ? 'rgba(111,186,44,0.05)' : 'white',
              textAlign: 'left', cursor: answered ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 500, color: 'var(--color-body)', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${isSelected ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        )
      })}
      {!answered && (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={picked === null}
          style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
          Check
        </button>
      )}
    </div>
  )
}
