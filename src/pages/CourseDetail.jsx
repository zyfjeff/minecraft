// =============================================================================
// CourseDetail — Course overview page (a.k.a. "lesson list timeline").
//
// Sits between CourseList and the per-kind study screens (VideoLesson /
// ReadingPractice / VocabPractice). Lets the user:
//   1. See the full lesson list with completion checkmarks (the missing
//      "已学/未学的可视化用户视角时间线" from the P2 review).
//   2. Inspect course metadata (kind / difficulty / xp / level requirement).
//   3. Resume or restart with a single big CTA at the top.
//
// This page was added to address P2 task #20. It does NOT change how the
// study pages themselves work; it is a thin overview layer that hands off to
// the existing routes when the user clicks "Start" / "Continue".
// =============================================================================
import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { computeCoursePercent, listLessonsForCourse } from '../lib/courses'
import { resolveThumbnailKey } from '../lib/courseThumbnails'
import { withTimeout } from '../lib/withTimeout'

const KIND_LABEL = {
  listening: 'Listening',
  reading: 'Reading',
  vocabulary: 'Vocabulary',
}

const KIND_COLOR = {
  listening: 'var(--tile-blue)',
  reading: 'var(--tile-green)',
  vocabulary: 'var(--tile-yellow)',
}

function studyRouteFor(course) {
  if (!course) return '/courses'
  if (course.kind === 'vocabulary') return `/vocab/${course.id}`
  if (course.kind === 'reading') return `/reading/${course.id}`
  return `/video/${course.id}`
}

export default function CourseDetail() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { courses, coursesLoaded, userCourseProgress, profile } = useAuth()

  const course = useMemo(() => {
    if (!Array.isArray(courses)) return null
    return courses.find((c) => c.id === courseId) || null
  }, [courses, courseId])

  const userLevel = profile?.level ?? 1
  const locked = course && (course.unlock_level || 1) > userLevel

  // ---- Lesson list ---------------------------------------------------------
  // listLessonsForCourse hits Supabase. We don't cache it here because the
  // catalog is small (~3-5 lessons per course) and the user only loads one
  // detail page at a time; caching would be premature.
  const [lessons, setLessons] = useState([])
  const [lessonsLoaded, setLessonsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!courseId) return undefined
    let cancelled = false
    setLessonsLoaded(false)
    setLoadError(null)
    ;(async () => {
      try {
        // 移动端切后台返回时 supabase 请求可能永远 pending，超时兜底
        // 避免详情页卡在 lessonsLoaded=false 骨架态。
        const rows = await withTimeout(listLessonsForCourse(courseId), 8000, 'course detail lessons')
        if (cancelled) return
        setLessons(rows || [])
      } catch (err) {
        if (!cancelled) setLoadError(err)
      } finally {
        if (!cancelled) setLessonsLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [courseId])

  // ---- Progress ------------------------------------------------------------
  const progressRow = userCourseProgress?.[courseId]
  const completedSet = useMemo(
    () => new Set(progressRow?.completed_lesson_ids || []),
    [progressRow],
  )
  const percent = computeCoursePercent(course?.lessons_count ?? lessons.length, progressRow)
  const completedCount = completedSet.size
  const totalCount = course?.lessons_count ?? lessons.length

  const isCompleted = percent === 100 && totalCount > 0
  const isInProgress = !isCompleted && completedCount > 0
  const ctaLabel = locked
    ? `Reach Lv.${course?.unlock_level || '?'} to unlock`
    : isCompleted
      ? 'Replay Course'
      : isInProgress
        ? 'Continue'
        : 'Start Course'

  // Loading + 404 ------------------------------------------------------------
  if (!coursesLoaded) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading…
      </div>
    )
  }
  if (!course) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Course not found</h2>
        <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-lg)' }}>
          This course may have been removed.
        </p>
        <Link to="/courses" style={{ color: 'var(--color-grass)', fontWeight: 700, textDecoration: 'none' }}>
          ← Back to Courses
        </Link>
      </div>
    )
  }

  const accentColor = KIND_COLOR[course.kind] || 'var(--tile-blue)'
  const thumbnailKey = resolveThumbnailKey(course) // reserved for richer thumb in v2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Back link */}
      <div>
        <Link
          to="/courses"
          style={{
            color: 'var(--color-muted)', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          {'← Browse Courses'}
        </Link>
      </div>

      {/* Header card */}
      <section style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        borderTop: `6px solid ${accentColor}`,
        boxShadow: 'var(--shadow-card)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-md)',
      }}>
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start', gap: 'var(--space-sm)',
          fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-pill)',
            background: 'var(--color-grass-wash)', color: 'var(--color-grass-active)',
          }}>
            {KIND_LABEL[course.kind] || course.kind || 'Course'}
          </span>
          {course.difficulty != null && (
            <span style={{
              padding: '2px 10px', borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-soft)', color: 'var(--color-muted)',
            }}>
              {'★ '.repeat(Math.max(1, course.difficulty)).trim()}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 28, lineHeight: 1.15 }}>
          {course.title || course.id}
        </h1>
        {course.description && (
          <p style={{ color: 'var(--color-body)', fontSize: 15, lineHeight: 1.5 }}>
            {course.description}
          </p>
        )}

        {/* Stat row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)',
          marginTop: 'var(--space-sm)',
        }}>
          <Stat label="Lessons" value={totalCount || '—'} />
          <Stat label="Time" value={course.est_minutes ? `${course.est_minutes} min` : '—'} />
          <Stat label="XP" value={course.xp_reward ? `+${course.xp_reward}` : '—'} />
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: 'var(--color-muted)', marginBottom: 6,
            }}>
              <span>Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--color-title)' }}>
                {completedCount}/{totalCount} · {percent}%
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 4, background: 'var(--color-surface-soft)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${percent}%`, height: '100%',
                background: percent === 100 ? 'var(--color-grass)' : accentColor,
                transition: 'width var(--motion-base) var(--motion-ease)',
              }} />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          disabled={locked}
          onClick={() => !locked && navigate(studyRouteFor(course))}
          style={{
            marginTop: 'var(--space-sm)',
            padding: '14px 24px',
            borderRadius: 'var(--radius-pill)',
            background: locked ? 'var(--color-disabled)' : 'var(--color-grass)',
            color: '#fff',
            border: 'none',
            fontSize: 16, fontWeight: 800,
            cursor: locked ? 'not-allowed' : 'pointer',
            boxShadow: locked ? 'none' : 'var(--shadow-button)',
          }}
        >
          {ctaLabel}
        </button>
      </section>

      {/* Lesson timeline */}
      <section style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 'var(--space-md)', letterSpacing: '0.02em' }}>
          Lesson Timeline
        </h3>

        {loadError ? (
          <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>
            Failed to load lessons. Pull down to refresh.
          </p>
        ) : !lessonsLoaded ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>Loading lessons…</p>
        ) : lessons.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
            No lessons configured yet.
          </p>
        ) : (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {lessons.map((l, idx) => {
              const done = completedSet.has(l.id)
              return (
                <li
                  key={l.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: done ? 'var(--color-grass-wash)' : 'var(--color-surface-soft)',
                    border: done ? '1px solid var(--color-grass)' : '1px solid transparent',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--color-grass)' : 'var(--color-cream)',
                    color: done ? '#fff' : 'var(--color-muted)',
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--color-title)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {l.title || `Lesson ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                      {l.kind === 'video_segment' && l.yt_end_sec != null && l.yt_start_sec != null
                        ? `${Math.max(1, Math.round((l.yt_end_sec - l.yt_start_sec) / 60))} min`
                        : l.kind === 'reading_passage'
                          ? 'Reading'
                          : l.kind || 'Lesson'}
                      {typeof l.xp_reward === 'number' && l.xp_reward > 0 && ` · +${l.xp_reward} XP`}
                    </div>
                  </div>
                  {done && (
                    <span style={{
                      fontSize: 11, color: 'var(--color-grass-active)', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Done
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Hidden machine-readable thumbnail key, helpful for future SEO/sharing */}
      <span style={{ display: 'none' }} data-thumbnail-key={thumbnailKey} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{
      background: 'var(--color-surface-soft)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-title)' }}>
        {value}
      </div>
    </div>
  )
}
