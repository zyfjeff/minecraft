#!/usr/bin/env node
/**
 * reading-enrich-plan.mjs
 *
 * Reads course-data/_reading-enrich-input.json (produced by generate-reading-courses.mjs)
 * and generates course-data/_reading-enrich-prompt.json — a structured prompt that
 * the agent (LLM) uses to produce paragraph extractions + quiz content.
 *
 * The agent then writes the output to course-data/_reading-enrich-output.json
 * which is consumed by reading-enrich-apply.mjs.
 *
 * Usage:
 *   node scripts/reading-enrich-plan.mjs
 *   node scripts/reading-enrich-plan.mjs --only reading-minecraft-10-animals
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const INPUT_PATH = path.join(ROOT, 'course-data', '_reading-enrich-input.json')
const PROMPT_PATH = path.join(ROOT, 'course-data', '_reading-enrich-prompt.json')

if (!fs.existsSync(INPUT_PATH)) {
  console.error(`Input file not found: ${INPUT_PATH}`)
  console.error('Run "node scripts/generate-reading-courses.mjs" first.')
  process.exit(1)
}

const input = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'))

const onlyIdx = process.argv.indexOf('--only')
const onlyId = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null

const tasks = onlyId
  ? input.tasks.filter((t) => t.reading_course_id === onlyId)
  : input.tasks

if (tasks.length === 0) {
  console.error('No tasks to process.')
  process.exit(1)
}

// =============================================================================
// Build the instruction prompt
// =============================================================================
const INSTRUCTION = `You are a children's English language teacher creating reading comprehension lessons from Minecraft video transcripts.

For each task, you must:

1. EXTRACT & REWRITE 段落: From the transcript_en, identify the most interesting and educational story moments, then REWRITE them into clear, well-structured paragraphs suitable for reading practice. Each paragraph should:
   - Be 50-100 words long
   - Use clear, complete sentences (fix the informal spoken grammar from the transcript)
   - Bold **important vocabulary words** using markdown (2-3 per paragraph)
   - Keep the Minecraft theme and story continuity
   - Be suitable for the specified difficulty level

2. GENERATE QUIZZES: For each segment, generate a quiz matching the assigned qtype:
   - vocabulary_cloze: Pick ONE bolded word as blank_word, provide 3 distractors (similar difficulty, same part of speech if possible)
   - comprehension: Write a question about the paragraph content with 4 options (correct index 0-3)
   - true_false: Write a statement that is either true or false based on the paragraph
   - word_match: Pick 3-4 vocabulary words from the paragraph, provide definitions to match
   - sentence_order: Break paragraph content into 3-4 sentences to reorder

3. TRANSLATE: Provide Chinese translations for:
   - Each segment's sentence_zh (translation of sentence_en paragraph)
   - The overall passage_md Chinese translation (transcript_zh)

4. HIGHLIGHT WORDS: Choose 5 key vocabulary words from across all paragraphs.

5. PASSAGE_MD: Combine all segment paragraphs into one passage_md field (with double newline between paragraphs).

6. COOLDOWN QUESTION: Write one final MCQ about the overall passage (4 options, correct index 0-3).

DIFFICULTY GUIDELINES:
- Difficulty 1 (Beginner): Simple sentences, common vocabulary (5-7 letter words), present/past tense only
- Difficulty 2 (Intermediate): Compound sentences okay, moderate vocabulary, varied tenses
- Difficulty 3 (Advanced): Complex sentences, advanced vocabulary, varied grammar structures

QUIZ PAYLOAD FORMATS:

vocabulary_cloze (qtype="vocabulary_cloze"):
  - blank_word: the word to blank out (must appear in sentence_en, bolded)
  - distractors: ["word1", "word2", "word3"] (3 wrong options)
  - quiz_payload: null (generated from blank_word + distractors)

comprehension (qtype="comprehension"):
  - blank_word: null
  - distractors: []
  - quiz_payload: {"prompt": "question?", "options": ["A","B","C","D"], "correct": 0}

true_false (qtype="true_false"):
  - blank_word: null
  - distractors: []
  - quiz_payload: {"statement": "The wolf wears a blue collar.", "correct": false}

word_match (qtype="word_match"):
  - blank_word: null
  - distractors: []
  - quiz_payload: {"pairs": [{"word":"obsidian","definition":"A dark rock for portals"},...], "shuffled_defs": ["def2","def1","def3",...]}

sentence_order (qtype="sentence_order"):
  - blank_word: null
  - distractors: []
  - quiz_payload: {"sentences": ["First sentence.","Second sentence.","Third sentence.","Fourth sentence."], "correct_order": [0,1,2,3]}
`

// =============================================================================
// Build per-task prompts
// =============================================================================
const OUTPUT_SCHEMA = {
  results: [
    {
      reading_course_id: 'reading-minecraft-10-animals',
      passage_md: 'Combined paragraphs with **bold** vocab words...',
      passage_zh: 'Chinese translation of passage...',
      highlight_words: ['word1', 'word2', 'word3', 'word4', 'word5'],
      segments: [
        {
          sort_order: 0,
          sentence_en: 'Paragraph text with **bold** words...',
          sentence_zh: 'Chinese translation...',
          blank_word: 'boldword',
          distractors: ['wrong1', 'wrong2', 'wrong3'],
          qtype: 'vocabulary_cloze',
          quiz_payload: null,
        },
      ],
      question: {
        kind: 'mcq',
        prompt: 'Overall question about the passage?',
        payload: { options: ['A', 'B', 'C', 'D'], correct: 0 },
        xp_reward: 10,
      },
    },
  ],
}

const prompt = {
  generated_at: new Date().toISOString(),
  instruction: INSTRUCTION,
  output_schema: OUTPUT_SCHEMA,
  output_file: 'course-data/_reading-enrich-output.json',
  tasks: tasks.map((t) => ({
    reading_course_id: t.reading_course_id,
    source_listening_id: t.source_listening_id,
    course_title: t.course_title,
    difficulty: t.difficulty,
    num_segments: t.num_segments,
    qtypes: t.qtypes,
    // Truncate transcript to avoid overly large prompts (keep first 8000 chars)
    transcript_en: t.transcript_en.slice(0, 8000),
    transcript_zh: t.transcript_zh.slice(0, 8000),
  })),
}

fs.writeFileSync(PROMPT_PATH, JSON.stringify(prompt, null, 2))
console.log(`Enrichment prompt written: ${PROMPT_PATH}`)
console.log(`Total tasks: ${tasks.length}`)
console.log(`\nNext step: Agent reads this prompt and writes course-data/_reading-enrich-output.json`)
console.log(`Then run: node scripts/reading-enrich-apply.mjs`)
