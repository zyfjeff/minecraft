#!/usr/bin/env node
/**
 * generate-vocab-from-import.mjs
 *
 * Analyzes VTT subtitle files from an imported playlist and extracts vocabulary
 * word candidates, then generates a structured prompt for the agent to produce
 * rich flashcard data (definitions, examples, translations).
 *
 * Usage:
 *   node scripts/generate-vocab-from-import.mjs
 *   node scripts/generate-vocab-from-import.mjs --from-import course-data/_skill-import.json
 *   node scripts/generate-vocab-from-import.mjs --limit 8   # max words per course
 *   node scripts/generate-vocab-from-import.mjs --courses 2  # how many vocab courses to generate
 *
 * Output:
 *   course-data/_vocab-enrich-prompt.json  (instructions for agent)
 *   course-data/_vocab-candidates.json     (raw word frequency data)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SUBS_DIR = path.join(ROOT, 'course-data', 'subs')
const IMPORT_PATH_DEFAULT = path.join(ROOT, 'course-data', '_skill-import.json')

// ── CLI args ─────────────────────────────────────────────────────────────────
const fromImportIdx = process.argv.indexOf('--from-import')
const importPath = fromImportIdx >= 0 ? path.resolve(process.argv[fromImportIdx + 1]) : IMPORT_PATH_DEFAULT

const limitIdx = process.argv.indexOf('--limit')
const WORDS_PER_COURSE = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : 8

const coursesIdx = process.argv.indexOf('--courses')
const NUM_COURSES = coursesIdx >= 0 ? parseInt(process.argv[coursesIdx + 1], 10) : 3

// ── Stop words ───────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
  'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these',
  'those', 'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'if', 'then', 'than',
  'too', 'very', 'just', 'also', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'from', 'by', 'up', 'out', 'off', 'as', 'into', 'about',
  'like', 'through', 'after', 'over', 'between', 'under', 'before',
  'during', 'without', 'again', 'there', 'here', 'where', 'when', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'what', 'which', 'who',
  'whom', 'why', 'oh', 'uh', 'um', 'okay', 'ok', 'yeah', 'yes', 'no',
  'well', 'now', 'right', 'really', 'still', 'even', 'back', 'much',
  'many', 'any', 'way', 'thing', 'things', 'got', 'get', 'go', 'going',
  'gone', 'come', 'came', 'know', 'knew', 'see', 'saw', 'look', 'make',
  'made', 'take', 'took', 'put', 'say', 'said', 'tell', 'told',
  'think', 'thought', 'want', 'need', 'use', 'used', 'try', 'keep',
  'let', 'give', 'gave', 'find', 'found', 'first', 'last', 'next',
  'new', 'old', 'good', 'bad', 'big', 'little', 'long', 'one', 'two',
  'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'lot', 'lots', 'bit', 'time', 'don', 're', 've', 'll', 't', 's', 'd',
  'im', 'ive', 'dont', 'didnt', 'doesnt', 'isnt', 'wasnt', 'wont',
  'cant', 'couldnt', 'shouldnt', 'wouldnt', 'havent', 'hasnt', 'hadnt',
  'thats', 'whats', 'heres', 'theres', 'lets', 'gonna', 'gotta',
  'wanna', 'cause', 'because', 'though', 'although', 'however',
  'actually', 'basically', 'probably', 'maybe', 'already', 'enough',
  'kind', 'something', 'anything', 'everything', 'nothing', 'someone',
  'anyone', 'everyone', 'another', 'around', 'away', 'down',
  'else', 'end', 'head', 'left', 'part', 'point', 'side', 'start',
  'turn', 'work', 'world', 'day', 'people', 'man', 'person',
  'place', 'number', 'hand', 'feel', 'play', 'run', 'move',
  'live', 'help', 'talk', 'seem', 'show', 'hear', 'call', 'set',
  'while', 'since', 'until', 'quite', 'pretty', 'lot',
  'minecraft', 'kenzo', 'english', 'episode', 'video', 'today',
  'guys', 'gonna', 'stuff', 'doing', 'getting', 'really',
])

// ── Minecraft term set ───────────────────────────────────────────────────────
const MC_TERMS = new Set([
  'creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'pig', 'cow',
  'sheep', 'chicken', 'wolf', 'bee', 'ghast', 'blaze', 'witch',
  'guardian', 'phantom', 'slime', 'villager', 'golem', 'pillager',
  'ocelot', 'dolphin', 'turtle', 'fox', 'panda', 'horse', 'rabbit',
  'axolotl', 'frog', 'allay', 'sniffer', 'warden',
  'pickaxe', 'sword', 'shovel', 'axe', 'hoe', 'bow', 'arrow', 'shield',
  'bucket', 'trident', 'crossbow', 'torch', 'lantern',
  'cobblestone', 'obsidian', 'iron', 'gold', 'diamond', 'emerald',
  'netherite', 'coal', 'redstone', 'lapis', 'quartz', 'ore', 'ingot',
  'crafting', 'enchanting', 'brewing', 'smelting', 'furnace', 'anvil',
  'fortress', 'stronghold', 'portal', 'nether', 'biome', 'cave',
  'armor', 'helmet', 'chestplate', 'leggings', 'boots',
  'wheat', 'carrot', 'potato', 'melon', 'pumpkin', 'bread', 'steak',
  'potion', 'splash', 'spawn', 'survival', 'hardcore',
  'inventory', 'chest', 'beacon', 'elytra', 'bamboo',
  'shelter', 'farm', 'trap', 'grinder',
])

// ── Theme categories for grouping ────────────────────────────────────────────
const THEME_CATEGORIES = [
  { slug: 'adventure-survival', title: 'Adventure & Survival', keywords: ['explore', 'discover', 'survive', 'journey', 'adventure', 'travel', 'search', 'danger', 'escape', 'challenge', 'brave', 'quest', 'wander', 'expedition', 'venture'] },
  { slug: 'building-crafting', title: 'Building & Crafting', keywords: ['build', 'craft', 'construct', 'design', 'create', 'place', 'furnace', 'anvil', 'table', 'house', 'wall', 'roof', 'floor', 'structure', 'upgrade'] },
  { slug: 'nature-world', title: 'Nature & World', keywords: ['cave', 'mountain', 'ocean', 'river', 'forest', 'desert', 'jungle', 'biome', 'underground', 'surface', 'cliff', 'valley', 'island', 'landscape'] },
  { slug: 'combat-mobs', title: 'Combat & Creatures', keywords: ['attack', 'fight', 'defeat', 'protect', 'damage', 'health', 'zombie', 'skeleton', 'creeper', 'spider', 'monster', 'hostile', 'weapon', 'armor', 'shield'] },
  { slug: 'resources-mining', title: 'Resources & Mining', keywords: ['mine', 'dig', 'collect', 'gather', 'ore', 'diamond', 'iron', 'gold', 'coal', 'emerald', 'resource', 'material', 'harvest', 'obtain', 'rare'] },
]

// ── VTT parsing ──────────────────────────────────────────────────────────────
function extractText(vttContent) {
  return vttContent
    .replace(/WEBVTT[\s\S]*?\n\n/, '')
    .replace(/\d\d:\d\d:\d\d\.\d{3}\s*-->\s*\d\d:\d\d:\d\d\.\d{3}[^\n]*/g, '')
    .replace(/<\d\d:\d\d:\d\d\.\d{3}>/g, '')
    .replace(/<\/?c[^>]*>/g, '')
    .replace(/align:start position:\d+%/g, '')
    .replace(/[^a-zA-Z\s'-]/g, ' ')
    .toLowerCase()
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(importPath)) {
  console.error(`Import file not found: ${importPath}`)
  console.error('Run fetch-meta.mjs first, or specify --from-import <path>')
  process.exit(1)
}

const importPlan = JSON.parse(fs.readFileSync(importPath, 'utf8'))
const videoIds = (importPlan.videos || []).map(v => v.id)
console.log(`Found ${videoIds.length} video(s) in import plan`)

// Parse VTT files for this import
const globalFreq = {}
const perFileWords = {}

for (const videoId of videoIds) {
  const vttPath = path.join(SUBS_DIR, `${videoId}.en.vtt`)
  if (!fs.existsSync(vttPath)) {
    console.warn(`[skip] No VTT for ${videoId}`)
    continue
  }
  const content = fs.readFileSync(vttPath, 'utf8')
  const text = extractText(content)
  const words = text.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w))

  const fileSet = new Set()
  for (const w of words) {
    globalFreq[w] = (globalFreq[w] || 0) + 1
    fileSet.add(w)
  }
  perFileWords[videoId] = fileSet
}

// Score and rank words
const totalFiles = Object.keys(perFileWords).length
const sorted = Object.entries(globalFreq)
  .map(([word, count]) => ({
    word,
    count,
    isMC: MC_TERMS.has(word),
    episodes: Object.values(perFileWords).filter(s => s.has(word)).length,
    spread: Object.values(perFileWords).filter(s => s.has(word)).length / totalFiles,
  }))
  .filter(w => w.count >= 3 && w.word.length >= 4)
  .sort((a, b) => {
    // Score: frequency + spread + MC bonus + length bonus
    const scoreA = a.count * 0.5 + a.spread * 10 + (a.isMC ? 8 : 0) + (a.word.length >= 6 ? 3 : 0)
    const scoreB = b.count * 0.5 + b.spread * 10 + (b.isMC ? 8 : 0) + (b.word.length >= 6 ? 3 : 0)
    return scoreB - scoreA
  })

console.log(`Total unique words (≥4 chars, ≥3 freq): ${sorted.length}`)

// Save raw candidates
const candidatesPath = path.join(ROOT, 'course-data', '_vocab-candidates.json')
fs.writeFileSync(candidatesPath, JSON.stringify({ total: sorted.length, words: sorted.slice(0, 200) }, null, 2))
console.log(`Candidates saved: ${candidatesPath} (top 200)`)

// Group into themed courses
const coursePlan = []
const usedWords = new Set()

for (let i = 0; i < Math.min(NUM_COURSES, THEME_CATEGORIES.length); i++) {
  const theme = THEME_CATEGORIES[i]
  const courseWords = []

  // First pass: find words matching this theme's keywords
  for (const w of sorted) {
    if (usedWords.has(w.word)) continue
    if (courseWords.length >= WORDS_PER_COURSE) break
    const isThemeMatch = theme.keywords.some(kw =>
      w.word === kw || w.word.startsWith(kw) || kw.startsWith(w.word)
    )
    if (isThemeMatch) {
      courseWords.push(w)
      usedWords.add(w.word)
    }
  }

  // Second pass: fill remaining slots with high-scoring unassigned words
  for (const w of sorted) {
    if (usedWords.has(w.word)) continue
    if (courseWords.length >= WORDS_PER_COURSE) break
    courseWords.push(w)
    usedWords.add(w.word)
  }

  if (courseWords.length >= 4) {
    coursePlan.push({
      slug: theme.slug,
      title: theme.title,
      words: courseWords.map(w => w.word),
    })
  }
}

console.log(`\nPlanned ${coursePlan.length} vocab course(s):`)
for (const c of coursePlan) {
  console.log(`  ${c.title}: ${c.words.join(', ')}`)
}

// ── Generate prompt for agent ────────────────────────────────────────────────
const INSTRUCTION = `You are creating Minecraft-themed English vocabulary flashcards for ESL learners.

For each word in each course, generate a complete vocab entry with:
1. id: lowercase slug (the word itself, e.g. "diamond")
2. word: the English word
3. pos: part of speech ("noun", "verb", "adj", "adv")
4. definition_en: Clear English definition (1-2 sentences, simple language)
5. definition_zh: Chinese translation (concise, 2-5 characters)
6. example_en: Example sentence using the word in a Minecraft context (10-20 words)
7. example_zh: Chinese translation of the example sentence
8. pixel_icon: One of "mob", "sword", "blocks", "enchant"
   - "mob" for creatures/animals
   - "sword" for tools, weapons, combat
   - "blocks" for building, nature, materials
   - "enchant" for magic, potions, rare items
9. synonyms: Array of 2 English synonyms
10. minecraft_role: How this word relates to Minecraft gameplay (1-2 sentences)
11. minecraft_obtain: How to find/get/use this in Minecraft (1 sentence)

IMPORTANT RULES:
- Keep definitions simple (ESL B1-B2 level)
- Example sentences MUST use a Minecraft context
- Chinese translations should be natural, not word-by-word
- For common English words, focus on how they're used in Minecraft
- difficulty constraint: courses table CHECK requires difficulty 1-3 only

OUTPUT FORMAT:
{
  "results": [
    {
      "course_slug": "adventure-survival",
      "course_title": "Adventure & Survival",
      "difficulty": 2,
      "description": "Learn essential vocabulary for exploring and surviving in Minecraft.",
      "words": [
        {
          "id": "explore",
          "word": "explore",
          "pos": "verb",
          "definition_en": "...",
          "definition_zh": "...",
          "example_en": "...",
          "example_zh": "...",
          "pixel_icon": "blocks",
          "synonyms": ["discover", "investigate"],
          "minecraft_role": "...",
          "minecraft_obtain": "..."
        }
      ]
    }
  ]
}`

const OUTPUT_SCHEMA = {
  results: [
    {
      course_slug: 'string',
      course_title: 'string',
      difficulty: 'number (1-3)',
      description: 'string',
      words: [
        {
          id: 'string (lowercase slug)',
          word: 'string',
          pos: 'noun|verb|adj|adv',
          definition_en: 'string',
          definition_zh: 'string',
          example_en: 'string',
          example_zh: 'string',
          pixel_icon: 'mob|sword|blocks|enchant',
          synonyms: ['string', 'string'],
          minecraft_role: 'string',
          minecraft_obtain: 'string',
        },
      ],
    },
  ],
}

const prompt = {
  generated_at: new Date().toISOString(),
  instruction: INSTRUCTION,
  output_schema: OUTPUT_SCHEMA,
  output_file: 'course-data/_vocab-enrich-output.json',
  playlist_source: importPlan.source || '',
  courses: coursePlan,
}

const promptPath = path.join(ROOT, 'course-data', '_vocab-enrich-prompt.json')
fs.writeFileSync(promptPath, JSON.stringify(prompt, null, 2))
console.log(`\nVocab enrichment prompt written: ${promptPath}`)
console.log(`\nNext step: Agent reads this prompt and writes course-data/_vocab-enrich-output.json`)
console.log(`Then run: node scripts/vocab-enrich-apply.mjs`)
