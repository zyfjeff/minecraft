// =============================================================================
// PracticeShell — 共享的练习页 UI 原子组件。
//
// 抽出 VideoLesson / ReadingPractice / VocabPractice 三处重复的：
//   • Hearts 心心展示（emoji 与 pixel 两种 variant）
//   • SegmentProgress 阶段进度条
//   • PhaseBadge 学习阶段徽章
//   • BackToCoursesLink / BackToCoursesButton 顶部返回与底部主 CTA
//
// 设计原则：仅替换内部实现，不改变页面整体结构、不改 data-qoder-id 标注。
// =============================================================================
import { Link } from 'react-router-dom'

const DEFAULT_MAX_HEARTS = 3

/**
 * 心心展示。
 * variant=emoji  → ❤️/🖤（带颜色）
 * variant=pixel  → ♥（像素风、灰度）
 */
export function HeartsDisplay({
  count = 0,
  max = DEFAULT_MAX_HEARTS,
  variant = 'emoji',
  size = 18,
  gap = 4,
  style,
  className,
  ...rest
}) {
  const filled = Math.max(0, Math.min(max, Number(count) || 0))
  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap, ...style }}
      {...rest}
    >
      {Array.from({ length: max }).map((_, i) => {
        const active = i < filled
        if (variant === 'pixel') {
          return (
            <span
              key={i}
              style={{
                fontSize: size,
                opacity: active ? 1 : 0.25,
                filter: active ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s ease',
              }}
            >
              ♥
            </span>
          )
        }
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              opacity: active ? 1 : 0.25,
              transition: 'opacity 0.3s ease',
            }}
          >
            {active ? '❤️' : '🖤'}
          </span>
        )
      })}
    </div>
  )
}

/** 段落 / 题目进度条。 */
export function SegmentProgress({ current = 0, total = 0, showLabel = true }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'rgba(0,0,0,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 3, width: `${pct}%`,
          background: 'var(--color-grass)', transition: 'width 300ms ease',
        }} />
      </div>
      {showLabel ? (
        <span style={{
          fontSize: 11, color: 'var(--color-muted)',
          fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {current}/{total}
        </span>
      ) : null}
    </div>
  )
}

const PHASE_TONES = {
  learn: { bg: 'rgba(244,180,0,0.12)', color: '#8B6914' },
  practice: { bg: 'rgba(76,175,80,0.12)', color: 'var(--color-grass-active)' },
  report: { bg: 'rgba(33,150,243,0.12)', color: '#1565C0' },
}

/** 阶段徽章：learn / practice / report 三色。 */
export function PhaseBadge({ phase, label }) {
  const tone = PHASE_TONES[phase] || PHASE_TONES.learn
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 16px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 700,
      background: tone.bg,
      color: tone.color,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {label || phase || ''}
    </span>
  )
}

/** 顶部小返回链接。 */
export function BackToCoursesLink({ label = 'Back to Courses', to = '/courses', style }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none', display: 'flex', alignItems: 'center',
        gap: 'var(--space-sm)', color: 'var(--color-grass)',
        fontWeight: 600, fontSize: 14,
        ...style,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
      </svg>
      {label}
    </Link>
  )
}

/** 底部主 CTA 按钮（用于 report 完成态）。 */
export function BackToCoursesButton({
  onClick, label = 'Back to Courses',
  block = true, style,
}) {
  const base = {
    padding: '14px 40px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-grass)',
    color: '#fff',
    fontWeight: 700, fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
  }
  if (onClick) {
    return (
      <button onClick={onClick} style={{ ...base, ...style }}>
        {label}
      </button>
    )
  }
  return (
    <Link
      to="/courses"
      className="btn btn-primary"
      style={{
        textAlign: 'center', textDecoration: 'none',
        display: block ? 'block' : 'inline-block',
        ...base,
        ...style,
      }}
    >
      {label}
    </Link>
  )
}
