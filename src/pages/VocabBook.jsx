import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchLearnedVocabWords } from '../lib/courses'
import { countDueWords } from '../lib/srs'

// Pixel-art book icon (page-local; distinct from the outline BookIcon in App.jsx)
function PixelBookIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="1" width="12" height="14" fill={color} rx="1" />
      <rect x="4" y="1" width="10" height="14" fill="#F7F3DF" rx="1" />
      <rect x="3" y="2" width="1" height="12" fill={color} />
      <rect x="5" y="4" width="7" height="1" fill={color} opacity="0.3" />
      <rect x="5" y="6" width="5" height="1" fill={color} opacity="0.3" />
      <rect x="5" y="8" width="6" height="1" fill={color} opacity="0.3" />
    </svg>
  )
}

// Pixel-art search icon
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5" stroke="var(--color-muted)" strokeWidth="2" />
      <line x1="11.5" y1="11.5" x2="15.5" y2="15.5" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// POS badge colors
const POS_COLORS = {
  noun: { bg: '#E3F2FD', color: '#1565C0' },
  verb: { bg: '#FFF3E0', color: '#E65100' },
  adjective: { bg: '#F3E5F5', color: '#6A1B9A' },
  adverb: { bg: '#E8F5E9', color: '#2E7D32' },
  default: { bg: 'var(--color-surface)', color: 'var(--color-body)' },
}

export default function VocabBook() {
  const { vocabMap, vocabLoaded, authUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLearned, setFilterLearned] = useState('all') // 'all' | 'learned' | 'new'
  const [expandedWord, setExpandedWord] = useState(null)
  const [learnedWords, setLearnedWords] = useState(new Set())
  const [learnedLoading, setLearnedLoading] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  // Batch rendering: only show BATCH_SIZE items initially; user clicks "Show More"
  // to reveal the next batch. Resets on search/filter change.
  const BATCH_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)

  // Fetch which words the user has learned
  useEffect(() => {
    const uid = authUser?.id
    if (!uid) { setLearnedLoading(false); return }
    let cancelled = false
    fetchLearnedVocabWords(uid)
      .then((words) => { if (!cancelled) setLearnedWords(words) })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[VocabBook] failed to load learned words', err)
      })
      .finally(() => { if (!cancelled) setLearnedLoading(false) })
    return () => { cancelled = true }
  }, [authUser?.id])

  // All vocab entries as sorted array
  const allWords = useMemo(() => {
    return Object.values(vocabMap || {}).sort((a, b) =>
      (a.word || '').localeCompare(b.word || '')
    )
  }, [vocabMap])

  // Filtered + searched words
  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchWord = (w.word || '').toLowerCase().includes(q)
        const matchDef = (w.definition_en || '').toLowerCase().includes(q)
        const matchDefZh = (w.definition_zh || '').toLowerCase().includes(q)
        if (!matchWord && !matchDef && !matchDefZh) return false
      }
      // Learned status filter
      if (filterLearned === 'learned') return learnedWords.has((w.word || '').toLowerCase())
      if (filterLearned === 'new') return !learnedWords.has((w.word || '').toLowerCase())
      return true
    })
  }, [allWords, searchQuery, filterLearned, learnedWords])

  // Group by first letter
  const groupedWords = useMemo(() => {
    const groups = {}
    for (const w of filteredWords) {
      const letter = (w.word || '?')[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(w)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredWords])

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(BATCH_SIZE) }, [searchQuery, filterLearned])

  // Truncated grouped list for batch rendering
  const visibleGrouped = useMemo(() => {
    let remaining = visibleCount
    const result = []
    for (const [letter, words] of groupedWords) {
      if (remaining <= 0) break
      const slice = words.slice(0, remaining)
      result.push([letter, slice])
      remaining -= slice.length
    }
    return result
  }, [groupedWords, visibleCount])

  const hasMore = filteredWords.length > visibleCount

  const totalCount = allWords.length
  const learnedCount = allWords.filter((w) => learnedWords.has((w.word || '').toLowerCase())).length
  const dueCount = useMemo(
    () => (authUser?.id && learnedWords.size > 0 ? countDueWords(authUser.id, learnedWords) : 0),
    [authUser?.id, learnedWords],
  )

  if (!vocabLoaded || learnedLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg) 0' }}>
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div className="skeleton-line" style={{ width: '200px', height: '24px', margin: '0 auto var(--space-md)' }} />
          <div className="skeleton-line" style={{ width: '300px', height: '16px', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  const posStyle = (pos) => POS_COLORS[pos] || POS_COLORS.default

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', padding: 'var(--space-lg) 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <PixelBookIcon size={28} color="var(--color-grass)" />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800,
            color: 'var(--color-title)', margin: 0,
          }}>
            Vocab Book
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
          {learnedCount} / {totalCount} words learned
        </p>
        {/* Progress bar */}
        <div style={{
          width: '200px', height: '8px', borderRadius: '4px',
          background: 'var(--color-surface-soft)', margin: '8px auto 0', overflow: 'hidden',
        }}>
          <div style={{
            width: `${totalCount > 0 ? (learnedCount / totalCount) * 100 : 0}%`,
            height: '100%', borderRadius: '4px',
            background: 'var(--color-grass)', transition: 'width 0.3s ease',
          }} />
        </div>
        {/* SRS review CTA — only when learned >= 1 (otherwise the queue is empty). */}
        {learnedCount > 0 && (
          <Link
            to="/vocab-review"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 12, padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: dueCount > 0 ? 'var(--color-grass)' : 'var(--color-surface)',
              color: dueCount > 0 ? '#fff' : 'var(--color-grass)',
              border: dueCount > 0 ? 'none' : '1px solid var(--color-grass)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              textDecoration: 'none',
            }}
          >
            🔁 {dueCount > 0 ? `Review ${dueCount} due` : 'Review mode'}
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', padding: '0 var(--space-md)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          border: `2px solid ${searchFocused ? 'var(--color-grass)' : 'transparent'}`,
          transition: 'border-color 0.2s',
        }}>
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search words..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '15px', fontFamily: 'var(--font-body)', color: 'var(--color-title)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                color: 'var(--color-muted)', fontSize: '16px', lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{
        display: 'flex', gap: 'var(--space-sm)', padding: '0 var(--space-md)',
        overflowX: 'auto',
      }}>
        {[
          { key: 'all', label: `All (${totalCount})` },
          { key: 'learned', label: `Learned (${learnedCount})` },
          { key: 'new', label: `New (${totalCount - learnedCount})` },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterLearned(f.key)}
            style={{
              padding: '6px 16px', borderRadius: 'var(--radius-pill)',
              border: '2px solid transparent', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
              whiteSpace: 'nowrap',
              background: filterLearned === f.key ? 'var(--color-grass)' : 'var(--color-surface)',
              color: filterLearned === f.key ? '#fff' : 'var(--color-body)',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Word List */}
      <div style={{ padding: '0 var(--space-md)' }}>
        {filteredWords.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)',
            color: 'var(--color-muted)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-sm)' }}>📖</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>
              No words found
            </p>
            <p style={{ fontSize: '13px' }}>
              {searchQuery ? 'Try a different search term.' : 'Complete lessons to learn new words!'}
            </p>
          </div>
        ) : (
          visibleGrouped.map(([letter, words]) => (
            <div key={letter} style={{ marginBottom: 'var(--space-lg)' }}>
              {/* Letter Header */}
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px',
                color: 'var(--color-grass)', padding: '4px 0', marginBottom: 'var(--space-xs)',
                borderBottom: '2px solid var(--color-grass-wash)',
                position: 'sticky', top: 0, background: 'var(--color-cream)', zIndex: 1,
              }}>
                {letter}
              </div>

              {words.map((w) => {
                const isLearned = learnedWords.has((w.word || '').toLowerCase())
                const isExpanded = expandedWord === w.id
                const ps = posStyle(w.pos)
                return (
                  <div key={w.id}>
                    {/* Word Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedWord(isExpanded ? null : w.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        width: '100%', padding: '10px 12px', border: 'none',
                        background: isExpanded ? 'var(--color-surface)' : 'transparent',
                        borderRadius: isExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Learned indicator */}
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: isLearned ? 'var(--color-grass)' : 'var(--color-disabled)',
                      }} />
                      {/* Word */}
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
                        color: 'var(--color-title)', flex: 1,
                      }}>
                        {w.word}
                      </span>
                      {/* POS badge */}
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: ps.bg, color: ps.color,
                      }}>
                        {w.pos}
                      </span>
                      {/* Expand arrow */}
                      <span style={{
                        fontSize: '12px', color: 'var(--color-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}>
                        ▼
                      </span>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{
                        padding: '12px 12px 16px', background: 'var(--color-surface)',
                        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                        marginBottom: '4px',
                      }}>
                        {/* English definition */}
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)' }}>EN</span>
                          <p style={{ fontSize: '14px', color: 'var(--color-title)', margin: '2px 0 0', lineHeight: 1.5 }}>
                            {w.definition_en}
                          </p>
                        </div>
                        {/* Chinese definition */}
                        {w.definition_zh && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)' }}>中文</span>
                            <p style={{ fontSize: '14px', color: 'var(--color-body)', margin: '2px 0 0', lineHeight: 1.5 }}>
                              {w.definition_zh}
                            </p>
                          </div>
                        )}
                        {/* Example */}
                        {w.example_en && (
                          <div style={{
                            background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px', marginTop: '4px',
                            borderLeft: '3px solid var(--color-grass-wash)',
                          }}>
                            <p style={{ fontSize: '13px', color: 'var(--color-title)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                              "{w.example_en}"
                            </p>
                            {w.example_zh && (
                              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                                {w.example_zh}
                              </p>
                            )}
                          </div>
                        )}
                        {/* Minecraft context */}
                        {(w.minecraft_role || w.minecraft_obtain) && (
                          <div style={{
                            display: 'flex', gap: 'var(--space-sm)', marginTop: '8px',
                            flexWrap: 'wrap',
                          }}>
                            {w.minecraft_role && (
                              <span style={{
                                fontSize: '11px', fontWeight: 600,
                                padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                                background: 'var(--color-grass-wash)', color: 'var(--color-emerald)',
                              }}>
                                ⛏ {w.minecraft_role}
                              </span>
                            )}
                            {w.synonyms && w.synonyms.length > 0 && (
                              <span style={{
                                fontSize: '11px', fontWeight: 600,
                                padding: '3px 8px', borderRadius: 'var(--radius-pill)',
                                background: '#FFF3E0', color: '#E65100',
                              }}>
                                ≈ {Array.isArray(w.synonyms) ? w.synonyms.join(', ') : w.synonyms}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
        {/* Show More button */}
        {hasMore && (
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
                padding: '10px 24px', borderRadius: 'var(--radius-pill)',
                border: '2px solid var(--color-grass)', background: 'transparent',
                color: 'var(--color-grass)', cursor: 'pointer',
              }}
            >
              Show More ({filteredWords.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
