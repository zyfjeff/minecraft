// Centralized thumbnail key inference for Reading and Vocabulary courses.
// Used by both the front-end CourseList and the skill's `generate-reading-courses.mjs`
// so that newly generated courses and existing courses share the same icon mapping.
//
// Valid keys must exist in `PixelThumbnails` inside `src/pages/CourseList.jsx`.

// All themed thumbnail keys grouped roughly by domain. Order matters: the first
// matching keyword wins. More specific keywords go first.
const READING_RULES = [
  // Specific places / structures
  { kw: ['stronghold'], key: 'r_stronghold' },
  { kw: ['end-portal', 'ender', 'the-end', 'into-the-end'], key: 'r_ender' },
  { kw: ['nether-portal', 'nether-fortress', 'into-the-nether', 'nether'], key: 'r_portal' },
  { kw: ['cave', 'mineshaft', 'underground', 'cavern', 'deep-cave'], key: 'r_cave' },
  { kw: ['cherry', 'blossom', 'grove'], key: 'r_cherry' },
  { kw: ['bamboo'], key: 'r_bamboo' },
  { kw: ['barn', 'farm-barn'], key: 'r_barn' },
  { kw: ['house', 'home', 'building-a-house', 'home-improvement', 'finishing-my-house', 'wall-upgrade'], key: 'r_house' },
  { kw: ['chest', 'anvil', 'loot', 'chest-room'], key: 'r_chest' },
  { kw: ['minecart', 'rail', 'rail-system'], key: 'r_minecart' },

  // Resources / items
  { kw: ['diamond'], key: 'r_diamond' },
  { kw: ['pickaxe', 'pick', 'mine', 'mining', 'striking-gold', 'gold'], key: 'r_pickaxe' },
  { kw: ['fish', 'fishing', 'sunken'], key: 'r_fish' },

  // Animals / mobs
  { kw: ['horse', 'taming-a-horse'], key: 'r_horse' },
  { kw: ['sheep', 'animal', 'animals', 'cow', 'pig', 'happy-ghast'], key: 'r_sheep' },
  { kw: ['dried-ghast', 'ghast', 'mob', 'monster', 'zombie', 'skeleton', 'creeper-encounter'], key: 'mob' },

  // Action / themes
  { kw: ['enchant', 'enchanting', 'enchanted', 'magic'], key: 'enchant' },
  { kw: ['fight', 'fighting', 'combat', 'tnt', 'sword', 'weapon', 'armor', 'attack'], key: 'sword' },
  { kw: ['xp', 'xp-farm', 'experience', 'redstone', 'machine', 'automatic', 'automatic-farm', 'music', 'music-disc', 'brewing', 'potato-farm'], key: 'redstone' },
  { kw: ['village', 'villager', 'making-friends', 'friend', 'new-skin', 'skin', 'trade'], key: 'villager' },
  { kw: ['biome', 'desert', 'wild', 'exploring-biomes', 'exploring-the-wild', 'exploring-a-village', 'a-new-journey', 'journey', 'journey-home'], key: 'biome' },

  // Generic adventure / fail / first-day fallbacks
  { kw: ['lost', 'failing', 'first-night', 'lost-everything', 'lost-my-world', '200-days'], key: 'creeper' },
]

// Vocabulary courses use a dedicated `v_*` icon set so they don't visually
// collide with Reading courses (which previously shared the same `r_*` icons).
// Order matters: more specific keywords first.
const VOCAB_RULES = [
  { kw: ['hostile', 'enemy', 'enemies', 'monster'], key: 'v_hostile' },
  { kw: ['friendly', 'animal', 'animals', 'pet', 'pets'], key: 'v_animal' },
  { kw: ['tool', 'tools', 'weapon', 'weapons'], key: 'v_tools' },
  { kw: ['precious', 'resource', 'resources', 'mining', 'ore', 'gem', 'gems'], key: 'v_resources' },
  { kw: ['food', 'cooking', 'eat', 'recipe', 'recipes'], key: 'v_food' },
  { kw: ['nature', 'landscape', 'biome', 'biomes', 'environment'], key: 'v_nature' },
  { kw: ['nether', 'end', 'dimension', 'dimensions'], key: 'v_dimension' },
  { kw: ['craft', 'crafting', 'machine', 'machines', 'redstone'], key: 'v_crafting' },
  { kw: ['action', 'verb', 'verbs'], key: 'v_action' },
  { kw: ['describe', 'describing', 'adjective', 'adjectives', 'adj'], key: 'v_adjective' },
  // Adventure / building / world fall AFTER the more specific rules above so that
  // e.g. `vocab-action-verbs` keeps v_action and `vocab-crafting-machines` keeps v_crafting.
  { kw: ['adventure', 'survive', 'survival'], key: 'v_adventure' },
  { kw: ['build', 'building'], key: 'v_building' },
  { kw: ['world'], key: 'v_world' },
  // Legacy fallbacks for older vocabulary courses (mob-encyclopedia / building-materials)
  // — they have an explicit `thumbnail_key` so resolveThumbnailKey will short-circuit
  // before reaching here, but keep the rules so direct calls still degrade gracefully.
  { kw: ['mob'], key: 'mob' },
  { kw: ['block', 'blocks', 'material', 'materials'], key: 'blocks' },
]

// Per-id overrides applied BEFORE keyword rules. Use this for courses whose id
// would otherwise collide with another course on a shared keyword.
const VOCAB_ID_OVERRIDES = {
  'vocab-adventure-survival': 'v_adventure',
  'vocab-building-crafting': 'v_building',
  'vocab-nature-world': 'v_world',
}

const READING_DEFAULT = 'r_cave'
const VOCAB_DEFAULT = 'v_adjective'

function normalize(text) {
  // Strip the franchise/series prefix so generic words like "mine" inside
  // "minecraft" don't accidentally trigger the mining/pickaxe rule.
  return String(text || '')
    .toLowerCase()
    .replace(/[_/]+/g, '-')
    .replace(/\bminecraft-?/g, '')
}

function pickByRules(haystack, rules, fallback) {
  for (const rule of rules) {
    for (const kw of rule.kw) {
      if (haystack.includes(kw)) return rule.key
    }
  }
  return fallback
}

// Infer reading thumbnail from id (preferred) or title.
export function inferReadingThumbnail(idOrTitle = '') {
  return pickByRules(normalize(idOrTitle), READING_RULES, READING_DEFAULT)
}

// Infer vocabulary thumbnail from id or title.
export function inferVocabThumbnail(idOrTitle = '') {
  const raw = String(idOrTitle || '').toLowerCase().trim()
  if (raw && Object.prototype.hasOwnProperty.call(VOCAB_ID_OVERRIDES, raw)) {
    return VOCAB_ID_OVERRIDES[raw]
  }
  return pickByRules(normalize(idOrTitle), VOCAB_RULES, VOCAB_DEFAULT)
}

// Resolve a course's display thumbnail key, considering kind and explicit
// `thumbnail_key`. The set of valid keys is enumerated to avoid showing
// the literal "reading" or other invalid values that won't render.
const VALID_PIXEL_KEYS = new Set([
  'creeper', 'sword', 'villager', 'biome', 'mob', 'redstone', 'enchant', 'blocks',
  'r_cave', 'r_barn', 'r_sheep', 'r_minecart', 'r_cherry', 'r_fish', 'r_house',
  'r_bamboo', 'r_portal', 'r_diamond', 'r_horse', 'r_stronghold', 'r_ender',
  'r_pickaxe', 'r_chest',
  // Vocabulary-only icons (per-course distinct visuals)
  'v_hostile', 'v_animal', 'v_tools', 'v_resources', 'v_food',
  'v_nature', 'v_dimension', 'v_crafting', 'v_action', 'v_adjective',
  'v_adventure', 'v_building', 'v_world',
])

export function resolveThumbnailKey(course) {
  if (!course) return 'blocks'
  const explicit = course.thumbnail_key
  // `thumbnail_key` 在 DB schema 中是 NOT NULL DEFAULT 'blocks'（见
  // 03_courses_schema.sql），无法区分"作者明确选了 blocks"与"未填落入默认"。
  // 对 reading / vocabulary 这两类有专属图标体系的课程，把 explicit==='blocks'
  // 视为未设置，继续走 keyword 推断；listening 等其他 kind 维持原行为。
  const isDefaultBlocks = explicit === 'blocks'
  const isThemedKind = course.kind === 'reading' || course.kind === 'vocabulary'
  if (explicit && VALID_PIXEL_KEYS.has(explicit) && !(isDefaultBlocks && isThemedKind)) {
    return explicit
  }
  if (course.kind === 'reading') return inferReadingThumbnail(course.id || course.title)
  if (course.kind === 'vocabulary') return inferVocabThumbnail(course.id || course.title)
  return explicit || 'blocks'
}
