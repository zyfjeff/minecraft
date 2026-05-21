import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchLearnedVocabCount } from '../lib/courses'
import {
  getLevelTitle,
  getAchievementProgress,
  fetchQuestCount,
  TREASURE_ITEMS,
  RARITY_CONFIG,
  isTreasureUnlocked,
} from '../lib/rewards'

/* ================================================================
   Pixel-art badge icons — keyed by the `icon` column stored in
   public.achievements. Unknown tokens fall back to 'pickaxe'.
   ================================================================ */
const BadgeIcons = {
  pickaxe: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="10" y="0" width="2" height="2" fill="#fff"/>
      <rect x="12" y="0" width="2" height="2" fill="#fff"/>
      <rect x="14" y="0" width="2" height="2" fill="#fff"/>
      <rect x="12" y="2" width="2" height="2" fill="#fff"/>
      <rect x="10" y="4" width="2" height="2" fill="#A08060"/>
      <rect x="8" y="6" width="2" height="2" fill="#A08060"/>
      <rect x="6" y="8" width="2" height="2" fill="#A08060"/>
      <rect x="4" y="10" width="2" height="2" fill="#A08060"/>
    </svg>
  ),
  diamond: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="6" y="2" width="4" height="2" fill="#B3E5FC"/>
      <rect x="4" y="4" width="8" height="2" fill="#4FC3F7"/>
      <rect x="3" y="6" width="10" height="4" fill="#0288D1"/>
      <rect x="5" y="10" width="6" height="2" fill="#01579B"/>
      <rect x="7" y="12" width="2" height="2" fill="#01579B"/>
    </svg>
  ),
  fire: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="7" y="1" width="2" height="2" fill="#FF9800"/>
      <rect x="6" y="3" width="4" height="2" fill="#FF5722"/>
      <rect x="5" y="5" width="6" height="3" fill="#FF9800"/>
      <rect x="4" y="8" width="8" height="3" fill="#F44336"/>
      <rect x="5" y="11" width="6" height="2" fill="#FF5722"/>
      <rect x="6" y="13" width="4" height="2" fill="#FFEB3B"/>
    </svg>
  ),
  book: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="2" width="10" height="12" fill="#795548"/>
      <rect x="4" y="3" width="8" height="10" fill="#FFECB3"/>
      <rect x="5" y="4" width="6" height="1" fill="#5D4037"/>
      <rect x="5" y="6" width="6" height="1" fill="#5D4037"/>
      <rect x="5" y="8" width="4" height="1" fill="#5D4037"/>
    </svg>
  ),
  headphones: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="3" width="8" height="2" fill="#424242"/>
      <rect x="3" y="5" width="2" height="2" fill="#424242"/>
      <rect x="11" y="5" width="2" height="2" fill="#424242"/>
      <rect x="2" y="7" width="3" height="5" fill="#616161"/>
      <rect x="11" y="7" width="3" height="5" fill="#616161"/>
      <rect x="3" y="8" width="1" height="3" fill="#9E9E9E"/>
      <rect x="12" y="8" width="1" height="3" fill="#9E9E9E"/>
    </svg>
  ),
  gem: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="5" y="2" width="6" height="2" fill="#80DEEA"/>
      <rect x="3" y="4" width="10" height="3" fill="#26C6DA"/>
      <rect x="4" y="7" width="8" height="3" fill="#00ACC1"/>
      <rect x="5" y="10" width="6" height="2" fill="#00838F"/>
      <rect x="7" y="12" width="2" height="2" fill="#006064"/>
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="7" y="1" width="2" height="2" fill="#FFEB3B"/>
      <rect x="6" y="3" width="4" height="2" fill="#FFEB3B"/>
      <rect x="2" y="5" width="12" height="2" fill="#FFC107"/>
      <rect x="4" y="7" width="8" height="2" fill="#FFC107"/>
      <rect x="3" y="9" width="4" height="2" fill="#FF9800"/>
      <rect x="9" y="9" width="4" height="2" fill="#FF9800"/>
      <rect x="2" y="11" width="3" height="2" fill="#FF9800"/>
      <rect x="11" y="11" width="3" height="2" fill="#FF9800"/>
    </svg>
  ),
  dragon: (
    <svg width="24" height="24" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="2" width="4" height="3" fill="#4A148C"/>
      <rect x="9" y="2" width="4" height="3" fill="#4A148C"/>
      <rect x="4" y="5" width="8" height="4" fill="#6A1B9A"/>
      <rect x="5" y="5" width="2" height="2" fill="#E040FB"/>
      <rect x="9" y="5" width="2" height="2" fill="#E040FB"/>
      <rect x="3" y="9" width="10" height="3" fill="#4A148C"/>
      <rect x="5" y="12" width="2" height="2" fill="#4A148C"/>
      <rect x="9" y="12" width="2" height="2" fill="#4A148C"/>
    </svg>
  ),
}

/* Color token -> CSS var mapping (matches public.achievements.color_token) */
const COLOR_TOKEN = {
  'tile-pink': 'var(--tile-pink)',
  'tile-teal': 'var(--tile-teal)',
  'tile-orange': 'var(--tile-orange)',
  'tile-blue': 'var(--tile-blue)',
  'tile-green': 'var(--tile-green)',
  'tile-yellow': 'var(--tile-yellow)',
  'tile-purple': 'var(--tile-purple)',
}

export default function Achievements(qoderProps) {
  const {
    profile,
    achievements,
    userUnlocks,
    achievementsLoaded,
    authUser,
  } = useAuth()

  const [activeTab, setActiveTab] = useState('badges')
  const [questCount, setQuestCount] = useState(0)
  const [vocabCount, setVocabCount] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)

  // Fetch lifetime quest completion count + real learned vocab count on mount.
  useEffect(() => {
    const uid = authUser?.id
    if (!uid) return
    fetchQuestCount(uid).then(setQuestCount)
    fetchLearnedVocabCount(uid).then(setVocabCount)
  }, [authUser?.id])

  // Derived data
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpToNext = profile?.xpToNext ?? 100
  const xpPercent = profile?.xpPercent ?? 0
  const streak = profile?.streak ?? 0
  const levelTitle = getLevelTitle(level)

  const unlockedSet = useMemo(
    () => new Set((userUnlocks || []).map(u => u.achievement_id)),
    [userUnlocks]
  )
  const unlockedCount = unlockedSet.size
  const totalBadges = (achievements || []).length

  return (
    <div
      data-component="achievements-page"
      style={{
        ...{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
        ...(qoderProps?.style),
      }}
      className={qoderProps?.className}
      data-qoder-id={qoderProps?.['data-qoder-id']}
      data-qoder-source={qoderProps?.['data-qoder-source']}
    >
      {/* ============ Level Overview Card ============ */}
      <section
        data-component="level-overview"
        style={{
          background: 'linear-gradient(135deg, var(--color-grass-wash) 0%, var(--color-surface) 50%, rgba(79,195,247,0.05) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
          {/* Level Circle */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'var(--color-grass)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 0 0 var(--color-grass-active), 0 8px 20px rgba(76,175,80,0.3)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LEVEL
            </span>
            <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {level}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>{levelTitle}</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginBottom: 'var(--space-md)' }}>
              {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP to Level {level + 1}
            </p>
            {/* XP Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 20,
                background: 'var(--color-surface-soft)',
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid var(--color-disabled)',
              }}
            >
              <div
                style={{
                  width: `${xpPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-grass) 0%, #66BB6A 100%)',
                  borderRadius: 8,
                  position: 'relative',
                  transition: 'width 0.4s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '8px 8px 0 0',
                  }}
                />
              </div>
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--color-title)',
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                {xp} / {xpToNext}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', flexShrink: 0 }}>
            {[
              { label: 'Words Learned', value: String(vocabCount) },
              { label: 'Quests Done', value: String(questCount) },
              { label: 'Day Streak', value: String(streak) },
              { label: 'Badges', value: `${unlockedCount}/${totalBadges}` },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-title)', fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How It Works Guide ============ */}
      <section
        data-component="rewards-guide"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setGuideOpen(prev => !prev)}
          style={{
            width: '100%',
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: 18 }}>📖</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-title)' }}>
              How It Works
            </span>
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="var(--color-muted)"
            style={{ transform: guideOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {guideOpen && (
          <div style={{ padding: '0 var(--space-lg) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />

            {/* XP & Leveling */}
            <GuideCard
              emoji="⚡"
              title="Earning XP"
              items={[
                'Complete daily quests on the Home page',
                'Finish course lessons (listening, reading, vocabulary)',
                'Answer quiz questions correctly (+5 XP each)',
              ]}
            />

            <GuideCard
              emoji="⬆️"
              title="Leveling Up"
              items={[
                `Collect enough XP to fill the progress bar → Level Up!`,
                'Each level requires more XP than the last (+50 per level)',
                'Higher levels unlock harder courses & new achievements',
              ]}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[
                  { range: 'Lv 1–3', title: 'Stone Miner' },
                  { range: 'Lv 4–6', title: 'Iron Crafter' },
                  { range: 'Lv 7–9', title: 'Gold Seeker' },
                  { range: 'Lv 10–14', title: 'Diamond Apprentice' },
                  { range: 'Lv 15–19', title: 'Emerald Master' },
                  { range: 'Lv 20+', title: 'Netherite Legend' },
                ].map(t => (
                  <span key={t.range} style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-grass-wash)',
                    color: 'var(--color-grass-active)',
                    whiteSpace: 'nowrap',
                  }}>
                    {t.range}: {t.title}
                  </span>
                ))}
              </div>
            </GuideCard>

            <GuideCard
              emoji="🔥"
              title="Day Streak"
              items={[
                'Complete at least one quest each day to build your streak',
                'Streaks track consecutive learning days',
                'Longer streaks unlock special achievements!',
              ]}
            />

            <GuideCard
              emoji="🏆"
              title="Achievement Badges"
              items={[
                'Badges unlock automatically when you meet the requirement',
                '4 types: Quest milestones, Streak goals, Level targets, Vocab mastery',
                'Track progress with the bar under each locked badge',
              ]}
            />

            <GuideCard
              emoji="🎁"
              title="Treasure Inventory"
              items={[
                'Each achievement unlocks a Minecraft item reward',
                'Reach level milestones (Lv 5, 10, 15) for bonus items',
                '4 rarities: Common → Rare → Epic → Legendary',
              ]}
            />
          </div>
        )}
      </section>

      {/* ============ Tab Switcher ============ */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <button
          className={`chip ${activeTab === 'badges' ? 'chip-active' : 'chip-inactive'}`}
          onClick={() => setActiveTab('badges')}
        >
          Achievement Badges
        </button>
        <button
          className={`chip ${activeTab === 'collection' ? 'chip-active' : 'chip-inactive'}`}
          onClick={() => setActiveTab('collection')}
        >
          Treasure Inventory
        </button>
      </div>

      {/* ============ Achievement Badges Grid ============ */}
      {activeTab === 'badges' && (
        <section
          data-component="badges-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}
        >
          {!achievementsLoaded ? (
            // Skeleton placeholders while loading
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                aria-hidden="true"
                style={{
                  height: 100,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-soft)',
                  opacity: 0.4,
                }}
              />
            ))
          ) : (
            (achievements || []).map(badge => {
              const unlocked = unlockedSet.has(badge.id)
              const icon = BadgeIcons[badge.icon] || BadgeIcons.pickaxe
              const bg = COLOR_TOKEN[badge.color_token] || 'var(--tile-teal)'
              const progress = unlocked
                ? null
                : getAchievementProgress(badge, profile, vocabCount, questCount)
              const progressPct = progress
                ? Math.round((progress.current / progress.total) * 100)
                : 0

              return (
                <div
                  key={badge.id}
                  className="card"
                  style={{
                    opacity: unlocked ? 1 : 0.65,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Badge icon circle */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: unlocked ? bg : 'var(--color-surface-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: unlocked
                        ? `0 3px 0 0 color-mix(in srgb, ${bg} 80%, black 20%)`
                        : 'none',
                    }}
                  >
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '2px' }}>{badge.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '6px' }}>
                      {badge.description}
                    </p>

                    {unlocked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-success)">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)' }}>
                          Unlocked!
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="progress-bar" style={{ height: 6, marginBottom: '4px' }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progressPct}%`,
                              background: 'var(--color-grass)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {progress.current} / {progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {/* ============ Treasure Inventory ============ */}
      {activeTab === 'collection' && (
        <section
          data-component="treasure-inventory"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}
        >
          {TREASURE_ITEMS.map(item => {
            const unlocked = isTreasureUnlocked(item, unlockedSet, level)
            const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-lg) var(--space-md)',
                  opacity: unlocked ? 1 : 0.4,
                  cursor: unlocked ? 'pointer' : 'default',
                }}
              >
                {/* Item icon area */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: unlocked
                      ? `color-mix(in srgb, ${rarity.color} 15%, var(--color-surface))`
                      : 'var(--color-surface-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${unlocked ? rarity.color : 'var(--color-disabled)'}`,
                    fontSize: '24px',
                  }}
                >
                  {unlocked ? (
                    item.emoji
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-disabled)">
                      <path d="M12 2C9.24 2 7 4.24 7 7V10H5V22H19V10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4Z" />
                    </svg>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: unlocked ? 'var(--color-title)' : 'var(--color-disabled)',
                    display: 'block',
                  }}
                >
                  {unlocked ? item.name : '???'}
                </span>

                {unlocked && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: 700,
                      marginTop: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: rarity.color,
                    }}
                  >
                    {rarity.label}
                  </span>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

/* ================================================================
   GuideCard — reusable card for the "How It Works" explainer.
   ================================================================ */
function GuideCard({ emoji, title, items, children }) {
  return (
    <div style={{
      padding: 'var(--space-md)',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-title)' }}>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
      {children}
    </div>
  )
}
