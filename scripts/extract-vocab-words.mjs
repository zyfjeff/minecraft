#!/usr/bin/env node
/**
 * extract-vocab-words.mjs
 *
 * Parses all VTT subtitle files from course-data/subs/ and extracts unique
 * English words with their frequency counts. Filters out stop words and
 * very short words. Groups by "Minecraft-related" vs "general English".
 *
 * Usage:  node scripts/extract-vocab-words.mjs
 * Output: course-data/vocab-word-freq.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SUBS_DIR = path.resolve(__dirname, '../course-data/subs')
const OUT_PATH = path.resolve(__dirname, '../course-data/vocab-word-freq.json')

// ── Stop words (too common to be useful for learning) ──────────────────
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
  // Minecraft-specific but too meta/common
  'minecraft', 'kenzo', 'english', 'episode',
])

// ── Minecraft term set (for flagging) ──────────────────────────────────
const MC_TERMS = new Set([
  'creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'pig', 'cow',
  'sheep', 'chicken', 'wolf', 'bee', 'ghast', 'blaze', 'witch',
  'guardian', 'phantom', 'slime', 'villager', 'golem', 'pillager',
  'ravager', 'evoker', 'vindicator', 'drowned', 'husk', 'stray',
  'wither', 'dragon', 'ocelot', 'cat', 'parrot', 'dolphin', 'turtle',
  'fox', 'panda', 'horse', 'donkey', 'mule', 'llama', 'rabbit',
  'squid', 'bat', 'mooshroom', 'strider', 'hoglin', 'piglin', 'axolotl',
  'pickaxe', 'sword', 'shovel', 'axe', 'hoe', 'bow', 'arrow', 'shield',
  'bucket', 'compass', 'map', 'shears', 'saddle', 'lead', 'trident',
  'crossbow', 'flint', 'steel', 'torch', 'lantern', 'campfire',
  'cobblestone', 'sandstone', 'obsidian', 'planks', 'plank', 'brick',
  'glass', 'wood', 'iron', 'gold', 'diamond', 'emerald', 'netherite',
  'coal', 'redstone', 'lapis', 'quartz', 'gravel', 'sand', 'dirt',
  'clay', 'stone', 'ore', 'ingot', 'nugget', 'block', 'slab', 'stair',
  'fence', 'gate', 'door', 'trapdoor', 'ladder', 'rail', 'piston',
  'lever', 'button', 'hopper', 'dispenser', 'dropper', 'observer',
  'repeater', 'comparator', 'daylight', 'detector', 'tnt',
  'crafting', 'enchanting', 'enchant', 'brewing', 'smelting', 'smelt',
  'furnace', 'anvil', 'grindstone', 'loom', 'smoker', 'blast',
  'cartography', 'fletching', 'smithing', 'stonecutter', 'barrel',
  'village', 'fortress', 'stronghold', 'portal', 'mineshaft', 'dungeon',
  'monument', 'temple', 'mansion', 'nether', 'biome', 'cave', 'ravine',
  'overworld', 'spawn', 'respawn', 'survival', 'creative', 'hardcore',
  'difficulty', 'armor', 'helmet', 'chestplate', 'leggings', 'boots',
  'wheat', 'carrot', 'potato', 'beetroot', 'melon', 'pumpkin',
  'sugarcane', 'apple', 'bread', 'cake', 'steak', 'porkchop', 'salmon',
  'cod', 'mushroom', 'berry', 'honey', 'honeycomb', 'seed',
  'sapling', 'bone', 'feather', 'leather', 'string', 'gunpowder',
  'pearl', 'blaze', 'rod', 'potion', 'splash', 'lingering',
  'xp', 'experience', 'level', 'health', 'hunger', 'saturation',
  'sprint', 'sneak', 'crouch', 'jump', 'swim', 'boat', 'raft',
  'mob', 'mobs', 'hostile', 'passive', 'neutral', 'tame', 'taming',
  'breed', 'breeding', 'loot', 'drop', 'inventory', 'hotbar', 'slot',
  'stack', 'chest', 'ender', 'shulker', 'beacon', 'conduit',
  'elytra', 'firework', 'rocket', 'bamboo', 'kelp', 'coral',
  'magma', 'soul', 'warp', 'crimson', 'basalt', 'blackstone',
  'respawn', 'anchor', 'lodestone', 'spyglass', 'amethyst', 'copper',
  'dripstone', 'deepslate', 'tuff', 'calcite', 'sculk', 'warden',
  'mangrove', 'frog', 'tadpole', 'allay', 'cherry', 'sniffer',
  'shelter', 'dock', 'farm', 'trap', 'mob', 'grinder',
])

// ── Parse VTT → plain text ─────────────────────────────────────────────
function extractText(vttContent) {
  // Strip VTT header, timestamps, and inline tags
  return vttContent
    .replace(/WEBVTT[\s\S]*?\n\n/, '')                     // header
    .replace(/\d\d:\d\d:\d\d\.\d{3}\s*-->\s*\d\d:\d\d:\d\d\.\d{3}[^\n]*/g, '')  // timestamps
    .replace(/<\d\d:\d\d:\d\d\.\d{3}>/g, '')               // word-level times
    .replace(/<\/?c[^>]*>/g, '')                             // <c> tags
    .replace(/align:start position:\d+%/g, '')              // positioning
    .replace(/[^a-zA-Z\s'-]/g, ' ')                         // non-alpha
    .toLowerCase()
}

// ── Main ────────────────────────────────────────────────────────────────
const vttFiles = fs.readdirSync(SUBS_DIR).filter(f => f.endsWith('.vtt'))
console.log(`Found ${vttFiles.length} VTT files`)

const globalFreq = {}  // word → count
const perFileWords = {}  // videoId → Set<word>

for (const file of vttFiles) {
  const videoId = file.replace('.en.vtt', '')
  const content = fs.readFileSync(path.join(SUBS_DIR, file), 'utf8')
  const text = extractText(content)
  const words = text.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w))

  const fileSet = new Set()
  for (const w of words) {
    globalFreq[w] = (globalFreq[w] || 0) + 1
    fileSet.add(w)
  }
  perFileWords[videoId] = fileSet
}

// Sort by frequency descending
const sorted = Object.entries(globalFreq)
  .sort((a, b) => b[1] - a[1])
  .map(([word, count]) => ({
    word,
    count,
    isMC: MC_TERMS.has(word),
    // How many episodes this word appears in
    episodes: Object.values(perFileWords).filter(s => s.has(word)).length,
  }))

// Filter: keep words appearing ≥3 times OR are MC terms
const filtered = sorted.filter(w =>
  (w.count >= 3 && w.word.length >= 3) || w.isMC
)

const mcWords = filtered.filter(w => w.isMC)
const generalWords = filtered.filter(w => !w.isMC && w.count >= 5 && w.word.length >= 4)

const result = {
  total_unique: Object.keys(globalFreq).length,
  total_filtered: filtered.length,
  mc_words_count: mcWords.length,
  general_words_count: generalWords.length,
  mc_words: mcWords.slice(0, 200),
  general_words: generalWords.slice(0, 300),
}

fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2))
console.log(`\nResults written to ${OUT_PATH}`)
console.log(`Total unique words: ${result.total_unique}`)
console.log(`MC words found: ${mcWords.length}`)
console.log(`General words (freq≥5, len≥4): ${generalWords.length}`)
console.log(`\nTop 30 MC words:`)
for (const w of mcWords.slice(0, 30)) {
  console.log(`  ${w.word.padEnd(20)} freq=${String(w.count).padStart(4)}  episodes=${w.episodes}`)
}
console.log(`\nTop 30 General words:`)
for (const w of generalWords.slice(0, 30)) {
  console.log(`  ${w.word.padEnd(20)} freq=${String(w.count).padStart(4)}  episodes=${w.episodes}`)
}
