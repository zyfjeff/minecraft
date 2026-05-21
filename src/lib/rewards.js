import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Level title — Minecraft-themed rank names based on the user's current level.
// ---------------------------------------------------------------------------
const LEVEL_TITLES = [
  { min: 1,  max: 3,  title: 'Stone Miner' },
  { min: 4,  max: 6,  title: 'Iron Crafter' },
  { min: 7,  max: 9,  title: 'Gold Seeker' },
  { min: 10, max: 14, title: 'Diamond Apprentice' },
  { min: 15, max: 19, title: 'Emerald Master' },
  { min: 20, max: 999, title: 'Netherite Legend' },
]

export function getLevelTitle(level) {
  const tier = LEVEL_TITLES.find(t => level >= t.min && level <= t.max)
  return tier?.title || 'Adventurer'
}

// ---------------------------------------------------------------------------
// Achievement progress — returns { current, total } for a single achievement
// so the UI can render a progress bar for locked badges.
// ---------------------------------------------------------------------------
export function getAchievementProgress(achievement, profile, vocabCount, questCount) {
  const threshold = achievement.threshold ?? 0
  switch (achievement.condition_type) {
    case 'quest_count':
      return { current: Math.min(questCount, threshold), total: threshold }
    case 'streak':
      return { current: Math.min(profile?.streak ?? 0, threshold), total: threshold }
    case 'level':
      return { current: Math.min(profile?.level ?? 1, threshold), total: threshold }
    case 'vocab_count':
      return { current: Math.min(vocabCount, threshold), total: threshold }
    default:
      return { current: 0, total: threshold || 1 }
  }
}

// ---------------------------------------------------------------------------
// Quest count — total lifetime completions (used for achievement progress).
// ---------------------------------------------------------------------------
export async function fetchQuestCount(userId) {
  if (!userId) return 0
  const { count, error } = await supabase
    .from('quest_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[rewards] fetchQuestCount failed', error)
    return 0
  }
  return count ?? 0
}

// ---------------------------------------------------------------------------
// Treasure inventory — static client-side mapping from achievement IDs (and
// level milestones) to Minecraft-themed item rewards. No extra DB table needed.
//
// Each entry:  { id, name, emoji, rarity, source }
//   source.type = 'achievement' | 'level'
//   source.id   = achievement id (string) or milestone level (number)
// ---------------------------------------------------------------------------

export const TREASURE_ITEMS = [
  // Achievement rewards
  { id: 'treasure-pickaxe',     name: 'Wooden Pickaxe',    emoji: '⛏️',  rarity: 'common',    source: { type: 'achievement', id: 'first-steps' } },
  { id: 'treasure-diamond',     name: 'Diamond Block',     emoji: '💎',  rarity: 'rare',      source: { type: 'achievement', id: 'word-miner' } },
  { id: 'treasure-blaze',       name: 'Blaze Rod',         emoji: '🔥',  rarity: 'rare',      source: { type: 'achievement', id: 'streak-master' } },
  { id: 'treasure-book',        name: 'Enchanted Book',    emoji: '📖',  rarity: 'epic',      source: { type: 'achievement', id: 'bookworm' } },
  { id: 'treasure-noteblock',   name: 'Note Block',        emoji: '🎵',  rarity: 'common',    source: { type: 'achievement', id: 'sharp-ears' } },
  { id: 'treasure-beacon',      name: 'Beacon',            emoji: '🏮',  rarity: 'legendary', source: { type: 'achievement', id: 'diamond-hunter' } },
  { id: 'treasure-enchanting',  name: 'Enchanting Table',  emoji: '✨',  rarity: 'epic',      source: { type: 'achievement', id: 'enchanter' } },
  { id: 'treasure-dragon-egg',  name: 'Dragon Egg',        emoji: '🥚',  rarity: 'legendary', source: { type: 'achievement', id: 'ender-dragon' } },

  // Level milestone rewards
  { id: 'treasure-iron-sword',  name: 'Iron Sword',        emoji: '🗡️',  rarity: 'common',    source: { type: 'level', id: 5 } },
  { id: 'treasure-golden-apple',name: 'Golden Apple',      emoji: '🍎',  rarity: 'rare',      source: { type: 'level', id: 10 } },
  { id: 'treasure-diamond-armor',name: 'Diamond Armor',    emoji: '🛡️',  rarity: 'epic',      source: { type: 'level', id: 15 } },
]

// Rarity display config — color and label
export const RARITY_CONFIG = {
  common:    { color: 'var(--color-muted)',   label: 'Common' },
  rare:      { color: 'var(--color-grass)',   label: 'Rare' },
  epic:      { color: 'var(--tile-purple)',   label: 'Epic' },
  legendary: { color: 'var(--color-gold)',    label: 'Legendary' },
}

// Check if a treasure item is unlocked given achievement unlocks + level.
export function isTreasureUnlocked(item, unlockedAchievementIds, level) {
  if (item.source.type === 'achievement') {
    return unlockedAchievementIds.has(item.source.id)
  }
  if (item.source.type === 'level') {
    return level >= item.source.id
  }
  return false
}
