// =============================================================================
// VocabPractice — Main page for vocabulary flashcard courses.
//
// Three-phase flow:  LEARN (flashcards) → PRACTICE (quiz) → REPORT
//
// Route: /vocab/:id  (courseId)
// Data flow:
//   1. Load lessons for courseId → pick first vocab_drill lesson
//   2. Build card list from lesson.highlight_words + vocabMap
//   3. Learn phase: flip cards, mark "Got it" / "Still learning"
//   4. Practice phase: quiz on all words (learning words prioritized)
//   5. Report phase: show results, save progress
// =============================================================================
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listLessonsForCourse, markLessonComplete, saveLessonReport } from '../lib/courses'
import { withTimeout } from '../lib/withTimeout'
import VocabCard from '../components/VocabCard'
import VocabQuiz from '../components/VocabQuiz'
import VocabReport from '../components/VocabReport'
import {
  HeartsDisplay,
  PhaseBadge,
  BackToCoursesButton,
} from '../components/PracticeShell'

const MAX_HEARTS = 3

export default function VocabPractice() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { session, courses, vocabMap, addXp, refreshUserCourseProgress } = useAuth()
  const userId = session?.user?.id

  // Data loading
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Phase: 'learn' | 'practice' | 'report'
  const [phase, setPhase] = useState('learn')

  // Learn phase state
  const [cardIndex, setCardIndex] = useState(0)
  const [masteredSet, setMasteredSet] = useState(new Set())
  const [learningSet, setLearningSet] = useState(new Set())

  // Practice phase state
  const [hearts, setHearts] = useState(MAX_HEARTS)

  // Report state
  const [quizResults, setQuizResults] = useState(null)
  const [wrongWordIds, setWrongWordIds] = useState([])
  const [xpAwarded, setXpAwarded] = useState(0)

  // Timer
  const startTimeRef = useRef(Date.now())
  const [timeSpentSec, setTimeSpentSec] = useState(0)

  // Find course info
  const course = useMemo(() => (courses || []).find(c => c.id === courseId), [courses, courseId])

  // Load lessons
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        // 移动端切后台返回时 supabase 请求可能永远 pending，超时兜底避免
        // 页面卡在 "Loading vocabulary..." 骨架态。
        const lessons = await withTimeout(listLessonsForCourse(courseId), 8000, 'vocab lessons')
        const drill = lessons.find(l => l.kind === 'vocab_drill')
        if (!cancelled) {
          if (drill) {
            setLesson(drill)
          } else {
            setError('No vocabulary lesson found for this course.')
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load lesson')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [courseId])

  // Build word list from highlight_words + vocabMap
  const words = useMemo(() => {
    if (!lesson?.highlight_words?.length || !vocabMap) return []
    return lesson.highlight_words
      .map(w => vocabMap[w.toLowerCase()])
      .filter(Boolean)
  }, [lesson, vocabMap])

  // Current card for learn phase
  const currentCard = words[cardIndex] || null

  // Learn phase handlers
  const handleGotIt = useCallback(() => {
    if (!currentCard) return
    setMasteredSet(prev => new Set([...prev, currentCard.id]))
    setLearningSet(prev => {
      const next = new Set(prev)
      next.delete(currentCard.id)
      return next
    })
    if (cardIndex < words.length - 1) {
      setCardIndex(i => i + 1)
    } else {
      // All cards seen → move to practice
      setPhase('practice')
    }
  }, [currentCard, cardIndex, words.length])

  const handleLearning = useCallback(() => {
    if (!currentCard) return
    setLearningSet(prev => new Set([...prev, currentCard.id]))
    setMasteredSet(prev => {
      const next = new Set(prev)
      next.delete(currentCard.id)
      return next
    })
    if (cardIndex < words.length - 1) {
      setCardIndex(i => i + 1)
    } else {
      setPhase('practice')
    }
  }, [currentCard, cardIndex, words.length])

  // Quiz handlers
  const handleQuizCorrect = useCallback(() => {
    // no-op — tracked by VocabQuiz internally
  }, [])

  const handleQuizWrong = useCallback((word) => {
    setHearts(h => {
      const next = Math.max(0, h - 1)
      return next
    })
  }, [])

  const handleQuizComplete = useCallback(async ({ results, wrongWords }) => {
    // Compute time
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setTimeSpentSec(elapsed)
    setQuizResults(results)
    setWrongWordIds(wrongWords)
    setPhase('report')

    // Calculate XP
    const xp = course?.xp_reward || 0
    setXpAwarded(xp)

    // Save progress
    try {
      if (userId && lesson?.id) {
        const res = await markLessonComplete(userId, courseId, lesson.id, xp)
        if (!res.alreadyCompleted && xp > 0) {
          await addXp(xp)
        }
        await refreshUserCourseProgress?.()

        // Compute per-qtype scores for report storage
        const perQtypeScores = {}
        for (const [qtype, { total, correct }] of Object.entries(results)) {
          if (total > 0) perQtypeScores[qtype] = { total, correct }
        }
        const totalSegs = Object.values(results).reduce((s, r) => s + r.total, 0)
        const correctCount = Object.values(results).reduce((s, r) => s + r.correct, 0)

        await saveLessonReport({
          userId,
          lessonId: lesson.id,
          totalSegments: totalSegs,
          correctCount,
          perQtypeScores,
          weakAreas: wrongWords,
          heartsRemaining: hearts,
          timeSpentSec: elapsed,
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[vocab] progress save failed', err)
    }
  }, [course, userId, courseId, lesson, hearts, addXp, refreshUserCourseProgress])

  // Back navigation
  const handleBack = useCallback(() => {
    navigate('/courses')
  }, [navigate])

  // ---------- Render ----------

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, margin: '60px auto var(--space-lg)',
          border: '4px solid var(--tile-yellow)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Loading vocabulary...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !words.length) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger, #c13c3c)', fontSize: 14 }}>
          {error || 'No words found for this lesson.'}
        </p>
        <button onClick={handleBack} style={{
          marginTop: 'var(--space-md)', padding: '10px 24px',
          borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--color-grass)', color: '#fff',
          fontWeight: 700, cursor: 'pointer',
        }}>
          Back to Courses
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 'var(--space-md)', padding: 'var(--space-md) 0',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--space-sm)',
      }}>
        <button onClick={handleBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, fontWeight: 600, color: 'var(--color-muted)',
          padding: '6px 8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Courses
        </button>

        {/* Hearts */}
        {phase !== 'report' ? (
          <HeartsDisplay count={hearts} max={MAX_HEARTS} variant="emoji" size={16} gap={2} />
        ) : null}
      </div>

      {/* Course title */}
      <div style={{ textAlign: 'center', padding: '0 var(--space-md)' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
          color: 'var(--color-title)', margin: '0 0 4px',
        }}>
          {course?.title || 'Vocabulary'}
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
          {phase === 'learn' ? `Learn ${words.length} words` :
           phase === 'practice' ? 'Test your knowledge' :
           'Session complete!'}
        </p>
      </div>

      {/* Phase badge */}
      <div style={{ textAlign: 'center' }}>
        <PhaseBadge
          phase={phase}
          label={phase === 'learn' ? 'Learn' : phase === 'practice' ? 'Practice' : 'Report'}
        />
      </div>

      {/* Phase content */}
      <div style={{ padding: '0 var(--space-sm)' }}>
        {phase === 'learn' ? (
          <VocabCard
            entry={currentCard}
            index={cardIndex}
            total={words.length}
            onGotIt={handleGotIt}
            onLearning={handleLearning}
          />
        ) : phase === 'practice' ? (
          <VocabQuiz
            words={words}
            learningWords={learningSet}
            hearts={hearts}
            onCorrect={handleQuizCorrect}
            onWrong={handleQuizWrong}
            onComplete={handleQuizComplete}
          />
        ) : (
          <>
            <VocabReport
              totalWords={words.length}
              masteredCount={masteredSet.size}
              quizResults={quizResults}
              wrongWordIds={wrongWordIds}
              words={words}
              heartsLeft={hearts}
              timeSpentSec={timeSpentSec}
              xpAwarded={xpAwarded}
              lessonTitle={course?.title}
            />
            <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              <BackToCoursesButton onClick={handleBack} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
