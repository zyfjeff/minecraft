import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchLearnedVocabCount } from '../lib/courses'
import { getLevelTitle, fetchQuestCount } from '../lib/rewards'
import { computeCoursePercent } from '../lib/courses'
import { exportStatsCsv, printWeeklyReport } from '../lib/exportStats'
import { withTimeout } from '../lib/withTimeout'

// Pixel-art chart icon
function ChartIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="12" width="3" height="4" fill={color} opacity="0.5" />
      <rect x="5" y="8" width="3" height="8" fill={color} opacity="0.7" />
      <rect x="9" y="5" width="3" height="11" fill={color} opacity="0.85" />
      <rect x="13" y="2" width="3" height="14" fill={color} />
    </svg>
  )
}

export default function StatsPage() {
  const {
    profile, authUser, todayCompletions, weekDots,
    courses, coursesLoaded, userCourseProgress,
    achievements, userUnlocks, vocabMap, vocabLoaded,
  } = useAuth()

  const [questCount, setQuestCount] = useState(0)
  const [learnedVocab, setLearnedVocab] = useState(0)
  const [extraLoading, setExtraLoading] = useState(true)

  // Re-fetch whenever user completes quests (todayCompletions length changes)
  // or course progress updates (progressLoaded toggles / userCourseProgress changes).
  const completionTrigger = (todayCompletions || []).length
  const progressTrigger = Object.keys(userCourseProgress || {}).length

  useEffect(() => {
    const uid = authUser?.id
    if (!uid) { setExtraLoading(false); return }
    let cancelled = false
    // 为该页面专属请求加 8s 超时兜底：移动端锁屏/切后台返回时
    // 这些 fetch 可能永远 pending，导致 extraLoading 卡住，整个 Stats
    // 页面陷入骨架态，仅能手动刷新恢复。
    Promise.allSettled([
      withTimeout(fetchQuestCount(uid), 8000, 'quest count')
        .then((v) => { if (!cancelled) setQuestCount(v) }),
      withTimeout(fetchLearnedVocabCount(uid), 8000, 'learned vocab count')
        .then((v) => { if (!cancelled) setLearnedVocab(v) }),
    ]).finally(() => { if (!cancelled) setExtraLoading(false) })
    return () => { cancelled = true }
  }, [authUser?.id, completionTrigger, progressTrigger])

  const displayName = profile?.displayName || 'Adventurer'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpToNext = profile?.xpToNext ?? 100
  const xpPercent = profile?.xpPercent ?? 0
  const streak = profile?.streak ?? 0
  const levelTitle = getLevelTitle(level)

  // Course stats
  const courseStats = useMemo(() => {
    const completed = (courses || []).filter((c) => {
      const prog = userCourseProgress[c.id]
      if (!prog) return false
      return computeCoursePercent(c.lessons_count, prog) === 100
    })
    const inProgress = (courses || []).filter((c) => {
      const prog = userCourseProgress[c.id]
      if (!prog) return false
      const pct = computeCoursePercent(c.lessons_count, prog)
      return pct > 0 && pct < 100
    })
    const totalLessons = Object.values(userCourseProgress || {})
      .reduce((sum, p) => sum + (p?.completed_lesson_ids?.length || 0), 0)
    return {
      total: (courses || []).length,
      completed: completed.length,
      inProgress: inProgress.length,
      notStarted: (courses || []).length - completed.length - inProgress.length,
      totalLessons,
    }
  }, [courses, userCourseProgress])

  // Achievement stats
  const achievementStats = useMemo(() => ({
    unlocked: (userUnlocks || []).length,
    total: (achievements || []).length,
  }), [userUnlocks, achievements])

  // Today's XP
  const todayXp = useMemo(() => {
    return (todayCompletions || []).reduce((s, c) => s + (Number(c.xp_awarded) || 0), 0)
  }, [todayCompletions])

  // Active days this week
  const activeDays = useMemo(() => (weekDots || []).filter(Boolean).length, [weekDots])

  const totalVocab = Object.keys(vocabMap || {}).length

  // Compose the snapshot consumed by both CSV export and the print report.
  // Built lazily (function form) so we always pull the latest derived values
  // when the user clicks export, not whatever was first memoized.
  const buildExportPayload = () => ({
    displayName,
    level,
    xp,
    xpToNext,
    streak,
    activeDays,
    todayXp,
    questCount,
    learnedVocab,
    achievementsUnlocked: achievementStats.unlocked,
    achievementsTotal: achievementStats.total,
    courseProgressList,
  })

  const handleExportCsv = () => {
    try { exportStatsCsv(buildExportPayload()) } catch (e) { console.error('CSV export failed', e) }
  }
  const handlePrintReport = () => {
    try { printWeeklyReport() } catch (e) { console.error('Print failed', e) }
  }

  // Course type breakdown
  const courseTypeBreakdown = useMemo(() => {
    const types = { listening: 0, reading: 0, vocabulary: 0 }
    for (const c of courses || []) {
      const prog = userCourseProgress[c.id]
      if (prog && computeCoursePercent(c.lessons_count, prog) === 100) {
        types[c.kind] = (types[c.kind] || 0) + 1
      }
    }
    return types
  }, [courses, userCourseProgress])

  // Per-course progress detail
  const courseProgressList = useMemo(() => {
    return (courses || []).map((c) => {
      const prog = userCourseProgress[c.id]
      const pct = prog ? computeCoursePercent(c.lessons_count, prog) : 0
      return { ...c, percent: pct }
    }).sort((a, b) => b.percent - a.percent)
  }, [courses, userCourseProgress])

  if (!coursesLoaded || !vocabLoaded || extraLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg) 0' }}>
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div className="skeleton-line" style={{ width: '200px', height: '24px', margin: '0 auto var(--space-md)' }} />
          <div className="skeleton-line" style={{ width: '300px', height: '16px', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg) 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <ChartIcon size={28} color="var(--color-grass)" />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800,
            color: 'var(--color-title)', margin: 0,
          }}>
            Learning Stats
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
          {displayName} · LV {level} {levelTitle}
        </p>
      </div>

      {/* Export actions — hidden in print so the report stays clean. */}
      <div
        className="stats-export-actions"
        style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)',
          padding: '0 var(--space-md)', flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleExportCsv}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', color: 'var(--color-title)',
            border: '1px solid var(--color-border, var(--color-surface-soft))',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer',
          }}
          title="Download stats as CSV"
        >
          ⬇ Export CSV
        </button>
        <button
          type="button"
          onClick={handlePrintReport}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-grass)', color: '#fff', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer',
          }}
          title="Open browser print dialog — choose Save as PDF"
        >
          📄 Parent Report (PDF)
        </button>
      </div>

      {/* XP & Level Card */}
      <div style={{
        margin: '0 var(--space-md)', padding: 'var(--space-md)',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--color-title)' }}>
            Total XP
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--color-xp)' }}>
            {xp.toLocaleString()}
          </span>
        </div>
        <div style={{
          height: '10px', borderRadius: '5px', background: 'var(--color-surface-soft)',
          overflow: 'hidden', marginBottom: '4px',
        }}>
          <div style={{
            width: `${xpPercent}%`, height: '100%', borderRadius: '5px',
            background: 'linear-gradient(90deg, var(--color-xp), #AB47BC)',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, textAlign: 'right' }}>
          {xp} / {xpToNext} XP to Level {level + 1}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)',
        padding: '0 var(--space-md)',
      }}>
        {[
          { label: 'Day Streak', value: streak, icon: '🔥', color: 'var(--color-gold)' },
          { label: 'Active This Week', value: `${activeDays}/7`, icon: '📅', color: 'var(--color-grass)' },
          { label: "Today's XP", value: todayXp, icon: '⚡', color: 'var(--color-xp)' },
          { label: 'Quests Done', value: questCount, icon: '⚔️', color: 'var(--color-emerald)' },
          { label: 'Words Learned', value: learnedVocab, icon: '📝', color: 'var(--color-diamond)' },
          { label: 'Achievements', value: `${achievementStats.unlocked}/${achievementStats.total}`, icon: '🏆', color: 'var(--color-gold)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
              padding: '12px', display: 'flex', flexDirection: 'column',
              gap: '4px', boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{stat.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>
                {stat.label}
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px',
              color: stat.color,
            }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Weekly Activity */}
      <div style={{
        margin: '0 var(--space-md)', padding: 'var(--space-md)',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
          color: 'var(--color-title)', margin: '0 0 var(--space-sm)',
        }}>
          This Week
        </h3>
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: '4px',
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={day} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                background: weekDots[i] ? 'var(--color-grass)' : 'var(--color-surface-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', marginBottom: '4px',
                transition: 'background 0.2s ease',
              }}>
                {weekDots[i] ? '✓' : ''}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: 600 }}>
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Course Type Breakdown */}
      <div style={{
        margin: '0 var(--space-md)', padding: 'var(--space-md)',
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
          color: 'var(--color-title)', margin: '0 0 var(--space-sm)',
        }}>
          Course Progress
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Completed', count: courseStats.completed, color: 'var(--color-grass)' },
            { label: 'In Progress', count: courseStats.inProgress, color: 'var(--color-gold)' },
            { label: 'Not Started', count: courseStats.notStarted, color: 'var(--color-disabled)' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px',
                color: s.color, display: 'block',
              }}>
                {s.count}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Skill breakdown bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {[
            { kind: 'listening', label: '🎧', color: 'var(--tile-blue)' },
            { kind: 'reading', label: '📖', color: 'var(--tile-green)' },
            { kind: 'vocabulary', label: '📝', color: 'var(--tile-purple)' },
          ].map((t) => (
            <div key={t.kind} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px' }}>{t.label}</span>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: 'var(--color-body)',
              }}>
                {courseTypeBreakdown[t.kind] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Course Progress */}
      <div style={{ padding: '0 var(--space-md)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
          color: 'var(--color-title)', margin: '0 0 var(--space-sm)',
        }}>
          Course Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {courseProgressList.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px', boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '6px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                  color: 'var(--color-title)', flex: 1,
                }}>
                  {c.title}
                </span>
                <span style={{
                  fontSize: '12px', fontWeight: 700,
                  color: c.percent === 100 ? 'var(--color-grass)' : 'var(--color-muted)',
                }}>
                  {c.percent}%
                </span>
              </div>
              <div style={{
                height: '6px', borderRadius: '3px', background: 'var(--color-surface-soft)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${c.percent}%`, height: '100%', borderRadius: '3px',
                  background: c.percent === 100 ? 'var(--color-grass)' : 'var(--color-gold)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Print-only parent weekly report. Hidden on screen via CSS; surfaces
          when window.print() is invoked. Uses static text so the export
          stays self-contained without external assets. */}
      <section className="weekly-report-print" aria-hidden="true">
        <header className="wr-header">
          <h1>CraftWords Weekly Report</h1>
          <p className="wr-subtitle">{displayName} · LV {level} {levelTitle} · {new Date().toLocaleDateString()}</p>
        </header>
        <section className="wr-section">
          <h2>This Week at a Glance</h2>
          <ul className="wr-grid">
            <li><strong>{activeDays}/7</strong><span>Active days</span></li>
            <li><strong>{streak}</strong><span>Day streak</span></li>
            <li><strong>{todayXp}</strong><span>Today&apos;s XP</span></li>
            <li><strong>{xp.toLocaleString()}</strong><span>Total XP</span></li>
            <li><strong>{questCount}</strong><span>Quests done</span></li>
            <li><strong>{learnedVocab}</strong><span>Words learned</span></li>
          </ul>
        </section>
        <section className="wr-section">
          <h2>Courses</h2>
          <p className="wr-line">
            Completed <strong>{courseStats.completed}</strong> · In Progress <strong>{courseStats.inProgress}</strong> · Not Started <strong>{courseStats.notStarted}</strong>
          </p>
          <table className="wr-table">
            <thead><tr><th>Course</th><th>Kind</th><th>Progress</th></tr></thead>
            <tbody>
              {courseProgressList.filter((c) => c.percent > 0).slice(0, 12).map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.kind}</td>
                  <td>{c.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="wr-section">
          <h2>Achievements</h2>
          <p className="wr-line">
            Unlocked <strong>{achievementStats.unlocked}</strong> of {achievementStats.total}
          </p>
        </section>
        <footer className="wr-footer">
          Generated by CraftWords • Learn English the Minecraft way.
        </footer>
      </section>
    </div>
  )
}
