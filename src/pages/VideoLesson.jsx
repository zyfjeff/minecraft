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
import {
  createPlayer,
  startPolling,
  buildTranscriptLines,
} from '../lib/ytPlayer'
import VocabPopover from '../components/VocabPopover'
import PixelWaveform from '../components/PixelWaveform'
import SequenceReorder from '../components/SequenceReorder'
import SpeedRound from '../components/SpeedRound'
import SegmentMCQ from '../components/SegmentMCQ'
import TrueFalse from '../components/TrueFalse'
import SoundMatch from '../components/SoundMatch'
import PhoneticPair from '../components/PhoneticPair'
import ListeningReport from '../components/ListeningReport'
import { HeartsDisplay } from '../components/PracticeShell'

// =============================================================================
// VideoLesson — Listening Studio (P0)
//
// New listening pedagogy:
//   1. The YT iframe is positioned off-screen so the kid only HEARS the audio.
//   2. The lesson is split into N micro-segments (one per sentence in
//      transcript_en). Each segment runs through:
//          idle → playing → answering → revealed
//      Subtitles for that segment are revealed only AFTER a correct answer.
//   3. The per-segment question is a Cloze: pick the missing key word from 4
//      chip options. The blank is taken from highlight_words when one of them
//      occurs in the segment, otherwise the longest non-filler word is used.
//   4. Three lives (hearts) and three replay tokens per segment.
//   5. After all segments are cleared, the original lesson-level MCQ runs as
//      a "Cooldown" summary check, which is what triggers markLessonComplete
//      so XP awards and progress recording stay identical to before.
// =============================================================================

const HEART_BUDGET = 3
const REPLAY_BUDGET = 3

// Common English filler words that should never become a cloze blank.
const FILLER_WORDS = new Set([
  'the', 'and', 'a', 'is', 'of', 'to', 'in', 'it', 'you', 'we', 'are', 'was',
  'be', 'on', 'with', 'for', 'this', 'that', 'they', 'them', 'so', 'or', 'as',
  'at', 'an', 'i', 'do', 'have', 'has', 'will', 'can', 'your', 'my', 'me',
  'but', 'if', 'when', 'what', 'how', 'because', 'just', 'today', 'very',
])

const FALLBACK_DISTRACTORS = [
  'safe', 'fast', 'small', 'run', 'stone', 'water', 'tree', 'jump',
  'green', 'build', 'mine', 'craft', 'block', 'friend', 'food',
]

// Pick one cloze blank target for a segment. Prefer a highlight_word that
// actually appears in the sentence, else fall back to the longest non-filler
// word with at least 4 letters. Returns lowercase string or null.
function pickBlankForSegment(segText, highlightWords) {
  const tokens = String(segText || '')
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z']/g, '').toLowerCase())
    .filter(Boolean)
  const tokenSet = new Set(tokens)
  const hi = (highlightWords || [])
    .map((w) => String(w).toLowerCase())
    .find((w) => tokenSet.has(w))
  if (hi) return hi
  const candidates = [...new Set(tokens)]
    .filter((w) => w.length >= 4 && !FILLER_WORDS.has(w))
    .sort((a, b) => b.length - a.length)
  return candidates[0] || null
}

// Build a 4-option shuffled chip list for a cloze blank. Distractors come
// from the vocabMap first (so they're real lesson vocabulary), with a
// fallback pool to top up small vocab maps.
function buildClozeOptions(blank, vocabMap) {
  if (!blank) return []
  const used = new Set([blank])
  const distractors = []
  const pool = Object.keys(vocabMap || {})
    .filter((k) => k !== blank && k.length >= 3)
    .sort(() => Math.random() - 0.5)
  for (const cand of pool) {
    if (distractors.length >= 3) break
    if (used.has(cand)) continue
    distractors.push(cand)
    used.add(cand)
  }
  for (const f of FALLBACK_DISTRACTORS) {
    if (distractors.length >= 3) break
    if (used.has(f)) continue
    distractors.push(f)
    used.add(f)
  }
  return [blank, ...distractors].sort(() => Math.random() - 0.5)
}

// Render a sentence with the blank either masked as ___ or highlighted.
function renderSegSentence(segText, blank, revealed) {
  if (!blank) return <span data-qoder-id="qel-span-2b1381c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2b1381c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:22}}">{segText}</span>
  const tokens = String(segText).split(/(\s+)/)
  return (
    <span data-qoder-id="qel-span-28137d08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-28137d08&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:5}}">
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return tok
        const stripped = tok.replace(/[^A-Za-z']/g, '').toLowerCase()
        if (stripped === blank) {
          if (revealed) {
            return (
              <span
                key={i}
                style={{
                  color: 'var(--color-success)',
                  fontWeight: 700,
                  borderBottom: '2px solid var(--color-success)',
                }}
               data-qoder-id="qel-span-29137e9b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-29137e9b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:15}}">
                {tok}
              </span>
            )
          }
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                minWidth: 90,
                borderBottom: '3px solid var(--color-grass)',
                textAlign: 'center',
                color: 'var(--color-grass)',
                fontWeight: 700,
                margin: '0 4px',
              }}
             data-qoder-id="qel-span-2e13867a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2e13867a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:118,&quot;column&quot;:13}}">
              ____
            </span>
          )
        }
        return <span key={i} data-qoder-id="qel-span-2f13880d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2f13880d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:16}}">{tok}</span>
      })}
    </span>
  )
}

// Pixel heart row: 3 hearts, dim ones for lost lives.
// 实现已迁移至 PracticeShell.HeartsDisplay，保留本组件以不破坏 canvas 标注。
function HeartsRow({ hearts, ...qoderProps }) {
  return (
    <HeartsDisplay
      count={hearts}
      max={3}
      variant="pixel"
      style={qoderProps?.style}
      className={qoderProps?.className}
      data-qoder-id={qoderProps?.["data-qoder-id"]}
      data-qoder-source={qoderProps?.["data-qoder-source"]}
    />
  )
}

export default function VideoLesson(qoderProps) {
  const { id: courseId } = useParams()
  const {
    courses,
    coursesLoaded,
    userCourseProgress,
    vocabMap,
    authUser,
    markLessonComplete,
    submitAnswer,
  } = useAuth()

  const course = useMemo(
    () => (courses || []).find((c) => c.id === courseId) || null,
    [courses, courseId],
  )

  const [lesson, setLesson] = useState(null)
  const [questions, setQuestions] = useState([])
  // dbSegments: pre-cut rows from public.lesson_segments. When non-empty we
  // bypass the legacy front-end transcript splitter (buildTranscriptLines) and
  // drive the Listening Studio directly from these authored sentences. When
  // empty (lesson has no rows yet) we fall back to the in-memory split so old
  // lessons keep working with zero data migration.
  const [dbSegments, setDbSegments] = useState([])
  const [lessonLoaded, setLessonLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [currentSec, setCurrentSec] = useState(0)
  const [popoverWord, setPopoverWord] = useState(null)

  // ---- Listening session state ----
  const [segIdx, setSegIdx] = useState(0)
  // 'idle' | 'playing' | 'answering' | 'revealed' | 'done'
  const [segState, setSegState] = useState('idle')
  const [hearts, setHearts] = useState(HEART_BUDGET)
  const [replays, setReplays] = useState(REPLAY_BUDGET)
  const [clozeChoices, setClozeChoices] = useState([])
  const [clozeWrongFlash, setClozeWrongFlash] = useState(false)

  // ---- Cooldown MCQ state (carried over from the old lesson-level quiz) ----
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizLocked, setQuizLocked] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [lessonCompleteResult, setLessonCompleteResult] = useState(null)

  // ---- Cooldown drill flow (P1): seq → speed → mcq → all-done.
  // The drills run after every segment is cleared; they each can cost hearts
  // but never auto-finish the lesson — only the MCQ triggers markLessonComplete
  // so XP awarding stays consistent.
  const [cooldownStep, setCooldownStep] = useState('seq')
  const [speedSummary, setSpeedSummary] = useState(null)

  const playerHostRef = useRef(null)
  const playerRef = useRef(null)

  // Anchors used by the auto-scroll UX:
  //   stageRef     → top of the video / listening section
  //   quizCardRef  → top of the per-segment quiz card
  // We scroll to the quiz card the moment a segment auto-pauses (so kids
  // immediately see the question), and back to the stage on "Next segment →"
  // (so they don't have to scroll up to watch the next clip).
  const stageRef = useRef(null)
  const quizCardRef = useRef(null)

  // ---- Report tracking (accumulated during the lesson) ----
  const lessonStartRef = useRef(Date.now())
  const reportScoresRef = useRef({}) // { [qtype]: { total, correct } }

  // ---------------------------------------------------------------------------
  // Load the first video_segment lesson + its questions.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    if (!courseId) return undefined
    setLessonLoaded(false)
    setLoadError(null)
    setLesson(null)
    setQuestions([])
    setDbSegments([])
    ;(async () => {
      try {
        const lessons = await listLessonsForCourse(courseId)
        const first = (lessons || []).find((l) => l.kind === 'video_segment') || null
        if (cancelled) return
        setLesson(first)
        if (first) {
          // Fetch quiz + pre-cut segments in parallel — both live in different
          // tables and have no dependency on each other.
          const [qs, segs] = await Promise.all([
            listQuestionsForLesson(first.id),
            fetchLessonSegments(first.id).catch((err) => {
              // eslint-disable-next-line no-console
              console.warn('[VideoLesson] fetchLessonSegments failed, falling back', err)
              return []
            }),
          ])
          if (cancelled) return
          setQuestions(qs || [])
          setDbSegments(segs || [])
        }
      } catch (err) {
        if (!cancelled) setLoadError(err)
      } finally {
        if (!cancelled) setLessonLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [courseId])

  // ---------------------------------------------------------------------------
  // Mount the YT IFrame player. The iframe itself is moved off-screen via the
  // wrapper style on its host div — we only want the audio. Polling drives the
  // currentSec state which downstream effects use to auto-pause at segment end.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!lesson || !lesson.yt_video_id || !playerHostRef.current) return undefined
    let cancelled = false
    let createdPlayer = null
    let stop = null
    ;(async () => {
      try {
        const p = await createPlayer(playerHostRef.current, {
          videoId: lesson.yt_video_id,
          start: lesson.yt_start_sec ?? undefined,
          end: lesson.yt_end_sec ?? undefined,
        })
        if (cancelled) {
          try { p.destroy() } catch (e) { /* noop */ }
          return
        }
        createdPlayer = p
        playerRef.current = p
        // Dev-only hook: expose the YT player on window so automated browser
        // tests / manual console debugging can monkey-patch getCurrentTime to
        // simulate playback in headless environments where YouTube refuses to
        // play audio without a real audio output device. Stripped in prod by
        // import.meta.env.DEV.
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          window.__ytPlayer = p
        }
        stop = startPolling(p, 200, (sec) => {
          if (!cancelled) setCurrentSec(sec)
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[VideoLesson] YT player init failed', err)
      }
    })()
    return () => {
      cancelled = true
      if (stop) stop()
      if (createdPlayer) {
        try { createdPlayer.destroy() } catch (e) { /* noop */ }
      }
      playerRef.current = null
    }
  }, [lesson])

  // ---------------------------------------------------------------------------
  // Derived: segments + per-segment cloze blanks.
  // Prefer authored rows from public.lesson_segments; fall back to the legacy
  // front-end transcript splitter when the lesson has no rows yet. Each
  // segment carries an optional `_row` reference back to the DB record so
  // saveSegmentAttempt can log against the real segment_id.
  // ---------------------------------------------------------------------------
  const segments = useMemo(() => {
    if (Array.isArray(dbSegments) && dbSegments.length > 0) {
      return dbSegments.map((row, i) => ({
        index: i,
        text: row.sentence_en,
        sentenceZh: row.sentence_zh || '',
        start: Number(row.start_sec) || 0,
        end: Number(row.end_sec) || 0,
        _row: row,
      }))
    }
    return buildTranscriptLines(
      lesson?.transcript_en,
      lesson?.yt_start_sec ?? 0,
      lesson?.yt_end_sec ?? 0,
    )
  }, [dbSegments, lesson?.transcript_en, lesson?.yt_start_sec, lesson?.yt_end_sec])
  const totalSegs = segments.length
  const blanks = useMemo(
    () => segments.map((s) => {
      // Authored blank wins; otherwise compute on the fly.
      if (s?._row?.blank_word) return String(s._row.blank_word).toLowerCase()
      return pickBlankForSegment(s.text, lesson?.highlight_words || [])
    }),
    [segments, lesson?.highlight_words],
  )
  const currentSeg = segments[segIdx] || null
  const currentBlank = blanks[segIdx] || null

  // Build cloze chips when entering a new segment.
  useEffect(() => {
    if (!currentBlank) {
      setClozeChoices([])
      return
    }
    setClozeChoices(buildClozeOptions(currentBlank, vocabMap))
  }, [segIdx, currentBlank, vocabMap])

  // Auto-pause at segment end.
  useEffect(() => {
    if (segState !== 'playing' || !currentSeg) return
    if (currentSec >= currentSeg.end - 0.05) {
      try { playerRef.current?.pauseVideo?.() } catch (e) { /* noop */ }
      const qtype = currentSeg?._row?.qtype || 'cloze'
      // 'none' segments have no quiz — go straight to revealed.
      if (qtype === 'none') {
        setSegState('revealed')
      } else if (qtype === 'cloze' && !currentBlank) {
        // Legacy: cloze segment without a pickable blank → skip quiz.
        setSegState('revealed')
      } else {
        setSegState('answering')
      }
    }
  }, [currentSec, segState, currentSeg, currentBlank])

  const progressRow = courseId ? (userCourseProgress?.[courseId] || null) : null
  const lessonAlreadyDone = !!(lesson && progressRow?.completed_lesson_ids?.includes(lesson.id))

  // ---------------------------------------------------------------------------
  // Cooldown MCQ (the original lesson-level quiz).
  // ---------------------------------------------------------------------------
  const activeQuestion = useMemo(() => {
    const q = (questions || []).find((row) => row.kind === 'mcq')
    if (!q) return null
    const payload = q.payload || {}
    const options = Array.isArray(payload.options) ? payload.options : []
    const correctIndex = Number.isInteger(payload.correct) ? payload.correct : -1
    return { ...q, options, correctIndex }
  }, [questions])

  // ---------------------------------------------------------------------------
  // Speed Round items: every segment that has a usable blank gets re-emitted as
  // a {sentence-with-____, blank, options} cloze. Skipping segments without a
  // pickable blank avoids dead-end rounds.
  // ---------------------------------------------------------------------------
  const speedItems = useMemo(() => {
    const out = []
    segments.forEach((seg, i) => {
      const blank = blanks[i]
      if (!blank) return
      const tokens = String(seg.text).split(/(\s+)/)
      let placed = false
      const sentenceParts = tokens.map((tok) => {
        if (/^\s+$/.test(tok)) return tok
        const stripped = tok.replace(/[^A-Za-z']/g, '').toLowerCase()
        if (!placed && stripped === blank) {
          placed = true
          return '____'
        }
        return tok
      })
      if (!placed) return
      out.push({
        key: `seg-${i}`,
        sentence: sentenceParts.join(''),
        blank,
        options: buildClozeOptions(blank, vocabMap),
      })
    })
    return out
  }, [segments, blanks, vocabMap])

  // ---------------------------------------------------------------------------
  // Stage actions.
  // ---------------------------------------------------------------------------
  function playCurrentSegment() {
    if (!currentSeg || !playerRef.current) return
    try {
      playerRef.current.seekTo(currentSeg.start, true)
      playerRef.current.playVideo()
      setSegState('playing')
    } catch (e) { /* noop */ }
  }

  function replayCurrentSegment() {
    if (replays <= 0) return
    setReplays((r) => Math.max(0, r - 1))
    playCurrentSegment()
  }

  // Generic answer handler for ALL segment quiz types. The individual
  // components call this with (isCorrect, choiceString).
  function handleSegmentAnswer(isCorrect, choice) {
    if (segState !== 'answering') return
    const qtype = currentSeg?._row?.qtype || 'cloze'
    // Track for report.
    const scores = reportScoresRef.current
    if (!scores[qtype]) scores[qtype] = { total: 0, correct: 0 }
    scores[qtype].total += 1
    if (isCorrect) scores[qtype].correct += 1
    // Compute the heart count AFTER this attempt.
    const heartsAfter = isCorrect ? hearts : Math.max(0, hearts - 1)
    // Best-effort persistence.
    const segRow = currentSeg?._row
    if (authUser?.id && segRow?.id) {
      saveSegmentAttempt({
        userId: authUser.id,
        segmentId: segRow.id,
        choice: String(choice ?? ''),
        isCorrect,
        heartsLeftAfter: heartsAfter,
        qtype,
      }).catch(() => {})
    }
    if (isCorrect) {
      setSegState('revealed')
      return
    }
    // wrong: lose 1 heart, brief flash.
    setHearts(heartsAfter)
    setClozeWrongFlash(true)
    setTimeout(() => setClozeWrongFlash(false), 600)
  }

  // Legacy cloze handler — delegates to handleSegmentAnswer.
  function handleClozeChoice(choice) {
    if (!currentBlank || segState !== 'answering') return
    const isCorrect = choice === currentBlank
    handleSegmentAnswer(isCorrect, choice)
  }

  function continueToNextSegment() {
    if (segIdx >= totalSegs - 1) {
      setSegState('done')
      setCooldownStep('seq')
      return
    }
    setSegIdx((i) => i + 1)
    setSegState('idle')
    setReplays(REPLAY_BUDGET)
    // Bring the listening stage back into view so the kid immediately sees
    // the next clip's play button instead of staring at the (now stale)
    // revealed-subtitle card.
    requestAnimationFrame(() => {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Auto-scroll the quiz card into view whenever a segment finishes playing
  // and a question (or its revealed answer) shows up below the fold. We
  // intentionally fire on both 'answering' and 'revealed' so users with
  // qtype === 'none' segments — which skip straight to revealed — also get
  // a smooth jump down.
  useEffect(() => {
    if (segState !== 'answering' && segState !== 'revealed') return undefined
    const id = requestAnimationFrame(() => {
      quizCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [segState, segIdx])

  // Advance cooldown drill chain. Skips speed if there are no usable items,
  // and skips mcq if the lesson never had one — in either case we still want
  // to call markLessonComplete on the way out.
  async function advanceCooldown(nextStep) {
    if (nextStep === 'speed' && speedItems.length === 0) {
      // Skip speed when nothing to drill.
      return advanceCooldown('mcq')
    }
    if (nextStep === 'mcq' && !activeQuestion && lesson) {
      const lc = await markLessonComplete(courseId, lesson)
      setLessonCompleteResult(lc)
      // Persist lesson report
      persistReport(lc?.xpAwarded || 0)
      setCooldownStep('all-done')
      return
    }
    if (nextStep === 'all-done') {
      persistReport(lessonCompleteResult?.xpAwarded || 0)
      setCooldownStep('all-done')
      return
    }
    setCooldownStep(nextStep)
  }

  // Persist the listening report to DB (best-effort, fire-and-forget).
  function persistReport(xp) {
    if (!authUser?.id || !lesson?.id) return
    const timeSpentSec = Math.round((Date.now() - lessonStartRef.current) / 1000)
    saveLessonReport({
      userId: authUser.id,
      lessonId: lesson.id,
      scores: reportScoresRef.current,
      heartsLeft: hearts,
      timeSpentSec,
      xpAwarded: xp,
    }).catch(() => {})
  }

  async function handleCooldownAnswer(idx) {
    if (!activeQuestion || quizLocked) return
    const isCorrect = idx === activeQuestion.correctIndex
    setQuizAnswer(idx)
    if (!isCorrect) {
      setQuizResult({ correct: false })
      return
    }
    setQuizLocked(true)
    const res = await submitAnswer(courseId, activeQuestion, true)
    setQuizResult({
      correct: true,
      xpAwarded: res?.xpAwarded || 0,
      alreadyAnswered: !!res?.alreadyAnswered,
    })
    if (res?.ok && lesson) {
      const lc = await markLessonComplete(courseId, lesson)
      setLessonCompleteResult(lc)
    }
  }

  function handleWordClick(word, entry) {
    setPopoverWord({ word, entry })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const ytEmbedReady = !!lesson?.yt_video_id
  const heartsZero = hearts <= 0

  return (
    <div
      data-component="video-lesson-page"
      style={{ ...({ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }), ...(qoderProps?.style) }}
      className={qoderProps?.className}
      data-qoder-id={qoderProps?.['data-qoder-id']}
      data-qoder-source={qoderProps?.['data-qoder-source']}
    >
      {/* Back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }} data-qoder-id="qel-div-9c0fb244" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c0fb244&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:409,&quot;column&quot;:7}}">
        <Link
          to="/courses"
          style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center',
            gap: 'var(--space-sm)', color: 'var(--color-grass)', fontWeight: 600, fontSize: 14,
          }}
         data-qoder-id="qel-link-442a9da8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-442a9da8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:9}}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-qoder-id="qel-svg-e83f3123" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-e83f3123&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:417,&quot;column&quot;:11}}">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"  data-qoder-id="qel-path-5c2b7500" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-5c2b7500&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:418,&quot;column&quot;:13}}"/>
          </svg>
          Back to Courses
        </Link>
        {course ? (
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }} data-qoder-id="qel-span-4e5a4c21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-4e5a4c21&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:11}}">· {course.title}</span>
        ) : null}
      </div>



      {/* Top status bar (lesson title + completion badge) */}
      {lesson ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
        }} data-qoder-id="qel-div-aea1b16e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aea1b16e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:448,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-afa1b301" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-afa1b301&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:454,&quot;column&quot;:11}}">
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }} data-qoder-id="qel-div-a8a1a7fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a8a1a7fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:455,&quot;column&quot;:13}}">
              LISTENING STUDIO
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-title)' }} data-qoder-id="qel-div-a9a1a98f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a9a1a98f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:458,&quot;column&quot;:13}}">
              {lesson.title || 'Listening segment'}
            </div>
          </div>
          {lessonAlreadyDone ? (
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-success)',
              background: 'rgba(111,186,44,0.12)', padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
            }} data-qoder-id="qel-span-bd61b6a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bd61b6a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:463,&quot;column&quot;:13}}">
              ✓ Completed
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Listening Stage — video visible, subtitles locked until quiz answer. */}
      <section
        ref={stageRef}
        data-component="listening-stage"
        style={{
          background: '#0f0f10',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl) var(--space-lg)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
       data-qoder-id="qel-listening-stage-73cd5f93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-listening-stage-73cd5f93&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;listening-stage&quot;,&quot;loc&quot;:{&quot;line&quot;:475,&quot;column&quot;:7}}">
        {/* Header: segment counter + hearts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }} data-qoder-id="qel-div-24a926f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-24a926f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:9}}">
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.7)' }} data-qoder-id="qel-span-be61b836" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-be61b836&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:11}}">
            {totalSegs > 0
              ? `SEGMENT ${Math.min(segIdx + 1, totalSegs)} / ${totalSegs}`
              : 'NO SEGMENTS'}
          </span>
          <HeartsRow hearts={hearts}  data-qoder-id="qel-heartsrow-99450c67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-heartsrow-99450c67&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;heartsrow&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:11}}"/>
        </div>

        {/* Video box — iframe visible, overlay dims the screen when not playing */}
        {ytEmbedReady ? (
          <div style={{
            position: 'relative', borderRadius: 12, overflow: 'hidden',
            background: 'black', aspectRatio: '16 / 9',
            // Cap the embed so it stays comfortably visible without
            // scrolling on typical laptop viewports. The 16:9 height of
            // 720px is 405px, which leaves room for the section header,
            // status caption, and quiz card to share the fold.
            width: '100%', maxWidth: 720, margin: '0 auto',
          }} data-qoder-id="qel-div-23a92562" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-23a92562&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:601,&quot;column&quot;:11}}">
            {/* YT iframe host — full size, fully visible */}
            <div ref={playerHostRef} style={{ width: '100%', height: '100%' }}
              data-qoder-id="qel-div-ada1afdb"  data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ada1afdb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:606,&quot;column&quot;:13}}"/>
            {/* Semi-transparent overlay + PixelRing when NOT playing */}
            {segState !== 'playing' ? (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.42)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (segState === 'idle' || (segState === 'answering' && replays > 0)) && !heartsZero
                    ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (heartsZero || segState === 'done') return
                  if (segState === 'idle') playCurrentSegment()
                  else if (segState === 'answering' && replays > 0) replayCurrentSegment()
                }}
               data-qoder-id="qel-div-1da91bf0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1da91bf0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:610,&quot;column&quot;:15}}">
                <PixelRing
                  active={false}
                  label={
                    segState === 'idle' ? '▶' :
                    segState === 'answering' ? '↻' :
                    segState === 'revealed' ? '✓' :
                    '★'
                  }
                  data-qoder-id="qel-pixelring-6fdcc05d"
                 data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelring-6fdcc05d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;pixelring&quot;,&quot;loc&quot;:{&quot;line&quot;:624,&quot;column&quot;:17}}"/>
              </div>
            ) : null}
            {/* Waveform strip at bottom while playing */}
            {segState === 'playing' ? (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '6px 12px 8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                display: 'flex', alignItems: 'center', gap: 8,
                pointerEvents: 'none',
              }} data-qoder-id="qel-div-1fa91f16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1fa91f16&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:638,&quot;column&quot;:15}}">
                <PixelWaveform active size={32}  data-qoder-id="qel-pixelwaveform-73158a9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelwaveform-73158a9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;pixelwaveform&quot;,&quot;loc&quot;:{&quot;line&quot;:645,&quot;column&quot;:17}}"/>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }} data-qoder-id="qel-span-c461c1a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c461c1a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:646,&quot;column&quot;:17}}">
                  No subtitles yet
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          // Fallback when player not ready
          <div style={{ color: 'white', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: 'var(--space-xl) 0' }} data-qoder-id="qel-div-1ca6dbc6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1ca6dbc6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:654,&quot;column&quot;:11}}">
            {!lessonLoaded ? 'Loading lesson…'
              : loadError ? `Failed to load: ${loadError.message || 'unknown'}`
              : 'No video lesson available yet.'}
          </div>
        )}

        {/* Status text below the video */}
        {ytEmbedReady ? (
          <div style={{ color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'center' }}
            data-qoder-id="qel-div-1fa91f16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1fa91f16&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:663,&quot;column&quot;:11}}">
            {totalSegs === 0
              ? 'No transcript provided.'
              : segState === 'idle'
                ? 'Watch carefully — subtitles unlock after your quiz.'
                : segState === 'playing'
                  ? 'Listening… no subtitles yet.'
                  : segState === 'answering'
                    ? `What word did you hear?  (${replays} replay${replays === 1 ? '' : 's'} left)`
                    : segState === 'revealed'
                      ? 'Nice ear! Subtitles unlocked below.'
                      : 'Lesson finished — answer the cooldown question.'}
          </div>
        ) : null}

        {/* Footer: source attribution chip */}
        {course?.source_label ? (
          <div style={{
            position: 'absolute', bottom: 12, left: 16,
            fontSize: 10, color: 'rgba(255,255,255,0.4)',
          }} data-qoder-id="qel-div-2aa93067" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2aa93067&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:539,&quot;column&quot;:11}}">
            🎧 {course.source_label}
          </div>
        ) : null}

        {heartsZero ? (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 'var(--space-sm)',
          }} data-qoder-id="qel-div-29a92ed4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-29a92ed4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:548,&quot;column&quot;:11}}">
            <span style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 700 }} data-qoder-id="qel-span-575ed77a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-575ed77a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:13}}">Out of hearts!</span>
            <button
              onClick={() => { setHearts(HEART_BUDGET); setSegIdx(0); setSegState('idle'); setReplays(REPLAY_BUDGET) }}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-pill)',
                border: 'none', background: 'var(--color-grass)', color: 'white',
                fontWeight: 700, cursor: 'pointer',
              }}
             data-qoder-id="qel-button-ea3da321" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ea3da321&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:555,&quot;column&quot;:13}}">
              Restart this lesson
            </button>
          </div>
        ) : null}
      </section>

      {/* Quiz card — dispatches to the right component based on qtype */}
      {currentSeg && (segState === 'answering' || segState === 'revealed') ? (
        <section
          ref={quizCardRef}
          data-component="quiz-card"
          className="card-flat"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-lg)',
            border: clozeWrongFlash ? '2px solid var(--color-danger)' : '2px solid transparent',
            transition: 'border-color 200ms ease',
          }}
         data-qoder-id="qel-cloze-card-a040feef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cloze-card-a040feef&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;cloze-card&quot;,&quot;loc&quot;:{&quot;line&quot;:571,&quot;column&quot;:9}}">
          {segState === 'answering' ? (
            (() => {
              const qtype = currentSeg?._row?.qtype || 'cloze'
              const payload = currentSeg?._row?.quiz_payload || {}
              switch (qtype) {
                case 'comprehension':
                case 'detail_mcq':
                case 'speaker_intent':
                  return (
                    <>
                      <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                        Listen and answer
                      </h4>
                      <div style={{
                        background: 'var(--color-cream)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', fontSize: 15, lineHeight: 1.5,
                        color: 'var(--color-title)', fontWeight: 500, marginBottom: 'var(--space-md)',
                      }}>
                        {currentSeg.text}
                      </div>
                      <SegmentMCQ
                        prompt={payload.prompt || 'What did you hear?'}
                        options={payload.options || []}
                        correctIndex={Number(payload.correct) || 0}
                        onAnswer={(ok, choice) => handleSegmentAnswer(ok, choice)}
                        disabled={heartsZero}
                      />
                    </>
                  )
                case 'true_false':
                  return (
                    <>
                      <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                        True or False?
                      </h4>
                      <div style={{
                        background: 'var(--color-cream)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', fontSize: 15, lineHeight: 1.5,
                        color: 'var(--color-title)', fontWeight: 500, marginBottom: 'var(--space-md)',
                      }}>
                        {currentSeg.text}
                      </div>
                      <TrueFalse
                        statement={payload.statement || ''}
                        correctAnswer={!!payload.correct}
                        onAnswer={(ok, choice) => handleSegmentAnswer(ok, choice)}
                        disabled={heartsZero}
                      />
                    </>
                  )
                case 'sound_match':
                  return (
                    <>
                      <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                        Sound Match
                      </h4>
                      <SoundMatch
                        prompt={payload.prompt || 'What sound did you hear?'}
                        options={payload.options || []}
                        correctIndex={Number(payload.correct) || 0}
                        onAnswer={(ok, choice) => handleSegmentAnswer(ok, choice)}
                        disabled={heartsZero}
                      />
                    </>
                  )
                case 'phonetic_pair':
                  return (
                    <>
                      <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                        Phonetic Challenge
                      </h4>
                      <PhoneticPair
                        pair={payload.pair || ['?', '?']}
                        correctIndex={Number(payload.correct) || 0}
                        onAnswer={(ok, choice) => handleSegmentAnswer(ok, choice)}
                        disabled={heartsZero}
                      />
                    </>
                  )
                default: // 'cloze'
                  return (
                    <>
                      <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                        Listen and fill the blank
                      </h4>
                      <div style={{
                        background: 'var(--color-cream)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', fontSize: 20, lineHeight: 1.6,
                        color: 'var(--color-title)', fontWeight: 600, marginBottom: 'var(--space-md)',
                      }}>
                        {renderSegSentence(currentSeg.text, currentBlank, false)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        {clozeChoices.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleClozeChoice(opt)}
                            style={{
                              padding: '10px 18px', borderRadius: 'var(--radius-pill)',
                              border: '2px solid var(--color-grass)', background: 'white',
                              color: 'var(--color-grass-active)', fontWeight: 700,
                              fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <p style={{ marginTop: 'var(--space-md)', fontSize: 12, color: 'var(--color-muted)' }}>
                        Listen first, then guess. Wrong picks cost a heart.
                      </p>
                    </>
                  )
              }
            })()
          ) : (
            <>
              {/* Revealed state: sentence + translation + next button */}
              <h4 style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
                Subtitles unlocked
              </h4>
              <div style={{
                background: 'var(--color-cream)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)', fontSize: 20, lineHeight: 1.6,
                color: 'var(--color-title)', fontWeight: 600, marginBottom: 'var(--space-md)',
              }}>
                {renderSegSentence(currentSeg.text, currentBlank, true)}
              </div>
              {currentSeg.sentenceZh ? (
                <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, marginBottom: 'var(--space-md)' }}>
                  {currentSeg.sentenceZh}
                </p>
              ) : null}
              <button
                onClick={continueToNextSegment}
                style={{
                  padding: '10px 20px', borderRadius: 'var(--radius-pill)',
                  border: 'none', background: 'var(--color-grass)', color: 'white',
                  fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }}
              >
                {segIdx >= totalSegs - 1 ? 'Finish listening →' : 'Next segment →'}
              </button>
            </>
          )}
        </section>
      ) : null}

      {/* Cooldown drill #1 — sequence reorder, only after all segments cleared */}
      {segState === 'done' && cooldownStep === 'seq' ? (
        <SequenceReorder
          segments={segments}
          onComplete={() => advanceCooldown('speed')}
          onLoseHeart={() => setHearts((h) => Math.max(0, h - 1))}
          disabled={heartsZero}
         data-qoder-id="qel-sequencereorder-8693c4ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sequencereorder-8693c4ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;sequencereorder&quot;,&quot;loc&quot;:{&quot;line&quot;:723,&quot;column&quot;:9}}"/>
      ) : null}

      {/* Cooldown drill #2 — 30-second speed cloze sprint */}
      {segState === 'done' && cooldownStep === 'speed' && speedItems.length > 0 ? (
        <SpeedRound
          items={speedItems}
          onComplete={(summary) => { setSpeedSummary(summary); advanceCooldown('mcq') }}
          onLoseHeart={() => setHearts((h) => Math.max(0, h - 1))}
          disabled={heartsZero}
          durationSec={30}
         data-qoder-id="qel-speedround-367e4ec8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-speedround-367e4ec8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;speedround&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:9}}"/>
      ) : null}

      {/* Cooldown MCQ — only after seq + speed are done */}
      {segState === 'done' && cooldownStep === 'mcq' && activeQuestion ? (
        <section
          data-component="cooldown-quiz"
          className="card-flat"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-lg)',
          }}
         data-qoder-id="qel-cooldown-quiz-9f8f379b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cooldown-quiz-9f8f379b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;cooldown-quiz&quot;,&quot;loc&quot;:{&quot;line&quot;:655,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-1d9a1166" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1d9a1166&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:664,&quot;column&quot;:11}}">
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: 'var(--tile-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} data-qoder-id="qel-div-1c9a0fd3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1c9a0fd3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:665,&quot;column&quot;:13}}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" data-qoder-id="qel-svg-824b5c84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-824b5c84&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:669,&quot;column&quot;:15}}">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"  data-qoder-id="qel-path-f0240f37" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f0240f37&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:670,&quot;column&quot;:17}}"/>
              </svg>
            </div>
            <h4 style={{ margin: 0 }} data-qoder-id="qel-h4-6f4c01c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-6f4c01c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:673,&quot;column&quot;:13}}">Cooldown · Comprehension Check</h4>
          </div>

          <div style={{
            background: 'var(--color-cream)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)', marginBottom: 'var(--space-md)',
          }} data-qoder-id="qel-div-209a161f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-209a161f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:11}}">
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-title)', marginBottom: 'var(--space-lg)' }} data-qoder-id="qel-p-55165aa8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-55165aa8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:680,&quot;column&quot;:13}}">
              {activeQuestion.prompt}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }} data-qoder-id="qel-div-269a1f91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-269a1f91&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:683,&quot;column&quot;:13}}">
              {activeQuestion.options.map((opt, i) => {
                const selected = quizAnswer === i
                const isCorrectChoice = i === activeQuestion.correctIndex
                const showResult = selected && quizResult
                const borderColor = showResult
                  ? (isCorrectChoice ? 'var(--color-success)' : 'var(--color-danger)')
                  : 'var(--color-disabled)'
                const bg = showResult
                  ? (isCorrectChoice ? 'rgba(111,186,44,0.08)' : 'rgba(224,90,90,0.08)')
                  : 'white'
                return (
                  <button
                    key={i}
                    onClick={() => handleCooldownAnswer(i)}
                    disabled={quizLocked}
                    style={{
                      padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${borderColor}`, background: bg,
                      textAlign: 'left',
                      cursor: quizLocked ? 'default' : 'pointer',
                      fontSize: 14, fontWeight: 500, color: 'var(--color-body)',
                      fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                      opacity: quizLocked && !selected ? 0.6 : 1,
                    }}
                   data-qoder-id="qel-button-e230ca96" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e230ca96&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:695,&quot;column&quot;:19}}">
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      border: `2px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 11, fontWeight: 700,
                    }} data-qoder-id="qel-span-c363feac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c363feac&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:21}}">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          {quizResult ? (
            <div style={{
              padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
              background: quizResult.correct ? 'rgba(111,186,44,0.1)' : 'rgba(224,90,90,0.1)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            }} data-qoder-id="qel-div-1997cc83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1997cc83&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:726,&quot;column&quot;:13}}">
              {quizResult.correct ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-success)" data-qoder-id="qel-svg-81491c5a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-81491c5a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:19}}">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"  data-qoder-id="qel-path-e521bf4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e521bf4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:734,&quot;column&quot;:21}}"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }} data-qoder-id="qel-span-bf63f860" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bf63f860&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:736,&quot;column&quot;:19}}">
                    {quizResult.alreadyAnswered
                      ? 'Correct! (already answered)'
                      : `Correct! +${quizResult.xpAwarded} XP${lessonCompleteResult?.xpAwarded ? ` · Lesson +${lessonCompleteResult.xpAwarded} XP` : ''}`}
                  </span>
                  <button
                    onClick={() => advanceCooldown('all-done')}
                    style={{
                      marginLeft: 'auto', padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)', border: 'none',
                      background: 'var(--color-grass)', color: 'white',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    View Report →
                  </button>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-danger)" data-qoder-id="qel-svg-7c49147b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-7c49147b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:744,&quot;column&quot;:19}}">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"  data-qoder-id="qel-path-e021b770" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e021b770&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:745,&quot;column&quot;:21}}"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)' }} data-qoder-id="qel-span-c263fd19" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c263fd19&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:747,&quot;column&quot;:19}}">
                    Try again — pick another option.
                  </span>
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* All-done — Listening Report */}
      {segState === 'done' && cooldownStep === 'all-done' ? (
        <ListeningReport
          scores={reportScoresRef.current}
          heartsLeft={hearts}
          timeSpentSec={Math.round((Date.now() - lessonStartRef.current) / 1000)}
          xpAwarded={lessonCompleteResult?.xpAwarded || 0}
          lessonTitle={lesson?.title || ''}
        />
      ) : null}

      {/* Key Words chip strip (always visible after lesson loads) */}
      {(lesson?.highlight_words || []).length > 0 ? (
        <section style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-md) var(--space-lg)',
        }} data-qoder-id="qel-section-05175ec0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-section-05175ec0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;section&quot;,&quot;loc&quot;:{&quot;line&quot;:759,&quot;column&quot;:9}}">
          <h4 style={{ fontSize: 13, marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-h4-7749cfc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-7749cfc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:763,&quot;column&quot;:11}}">Key Words</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }} data-qoder-id="qel-div-aa9f6c8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aa9f6c8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:764,&quot;column&quot;:11}}">
            {lesson.highlight_words.map((word) => {
              const entry = vocabMap?.[String(word).toLowerCase()]
              return (
                <span
                  key={word}
                  onClick={() => handleWordClick(String(word).toLowerCase(), entry)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-grass-wash)', color: 'var(--color-grass-active)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                 data-qoder-id="qel-span-546b9eb4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-546b9eb4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:768,&quot;column&quot;:17}}">
                  {word}
                </span>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Source attribution */}
      {course?.source_label ? (
        <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', marginTop: 'var(--space-md)' }} data-qoder-id="qel-p-4a1ac685" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4a1ac685&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:787,&quot;column&quot;:9}}">
          Audio courtesy of{' '}
          {course.source_url ? (
            <a href={course.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-muted)' }} data-qoder-id="qel-a-6d00671a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-a-6d00671a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;a&quot;,&quot;loc&quot;:{&quot;line&quot;:790,&quot;column&quot;:13}}">
              {course.source_label}
            </a>
          ) : course.source_label}
          {course.source_license ? ` · ${course.source_license}` : ''}
        </p>
      ) : null}

      {!coursesLoaded ? null : !course ? (
        <p style={{ fontSize: 13, color: 'var(--color-danger)', textAlign: 'center' }} data-qoder-id="qel-p-441abd13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-441abd13&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:9}}">
          Course “{courseId}” not found.{' '}
          <Link to="/courses" style={{ color: 'var(--color-grass)' }} data-qoder-id="qel-link-493beea8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-493beea8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:801,&quot;column&quot;:11}}">Back to courses</Link>
        </p>
      ) : null}

      {popoverWord ? (
        <VocabPopover
          word={popoverWord.word}
          entry={popoverWord.entry}
          onClose={() => setPopoverWord(null)}
         data-qoder-id="qel-vocabpopover-637762f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-vocabpopover-637762f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/VideoLesson.jsx&quot;,&quot;componentName&quot;:&quot;VideoLesson&quot;,&quot;elementRole&quot;:&quot;vocabpopover&quot;,&quot;loc&quot;:{&quot;line&quot;:806,&quot;column&quot;:9}}"/>
      ) : null}
    </div>
  )
}

// =============================================================================
// PixelRing — big round play button. Very lightweight: no canvas, just a
// styled <button> with an animated ring when active.
// =============================================================================
function PixelRing({ active, onClick, label, ...qoderProps }) {
  return (
    <button
      onClick={onClick}
      aria-label="play segment"
      style={{ ...({
        width: 120, height: 120, borderRadius: '50%',
        border: '6px solid var(--color-grass)',
        background: active ? 'var(--color-grass)' : '#1a1a1c',
        color: 'white',
        fontSize: 48,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active
          ? '0 0 0 8px rgba(111,186,44,0.25), 0 0 0 16px rgba(111,186,44,0.12)'
          : '0 4px 12px rgba(0,0,0,0.4)',
        animation: active ? 'pixel-ring-pulse 1.2s ease-in-out infinite' : 'none',
        transition: 'background 200ms ease, box-shadow 200ms ease',
        fontFamily: 'var(--font-body)',
      }), ...(qoderProps?.style) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {label}
    </button>
  )
}
