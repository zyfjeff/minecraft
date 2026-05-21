# Algorithm Reference — Unified Course Generation

This document describes the algorithms and content generation guidelines for all
three course types: Listening, Reading, and Vocabulary.

---

## Part 1: Listening Course — Segment Scoring + Cloze Generation

Source: `react-vite/scripts/generate-courses-v2.mjs`

### 1.1 Pipeline overview

```
VTT (YouTube ASR)
  → parseVtt(): rolling cue dedup + word-level timestamps → micro-segments
  → scoreSegment() per segment (teaching value 0..N)
  → chooseSegments(): greedy with min-spread → pick 5
  → trimSentence(): clamp to 12–25 words at clause boundary
  → pickBlankWord(): cross-segment-deduped blank
  → pickDistractors(): per-segment seeded shuffle, lesson-wide dedup
  → buildCoursePayload(): course/lesson/segments JSON
```

### 1.2 parseVtt

- Folds rolling-cue duplicates ("a", "a quick", "a quick brown") into a single
  cue with the **last** word's end timestamp as cue end.
- Splits at sentence boundaries (`. ! ?`) and at long pauses (>1.5 s).
- Emits micro-segments of `minSec=12, maxSec=30` seconds.

### 1.3 scoreSegment

Higher = better teaching value. Components:

| Signal | Weight |
|---|---|
| Length 12–25 words | +5 |
| Length 25–35 words | +2 |
| Has action verb (run, build, mine, dig, ...) | +3 |
| Has Minecraft noun (zombie, diamond, pickaxe, ...) | +3 |
| Has past-tense `-ed` content word | +2 |
| Has `-ing` content word | +2 |
| Sentence ends with `.` `!` `?` | +2 |
| Starts with capital letter | +1 |
| **Penalties** | |
| Matches BOILERPLATE_PATTERNS | −10 |
| Contains "https://" or "youtube.com" | −5 |
| Contains repeated filler ("um um", "uh uh") | −3 |
| All words ≤4 chars (likely greeting) | −4 |

### 1.4 chooseSegments

Goals: top-N by score AND ≥45-60 s spread so the 5 picks span the video.

Greedy:
1. Sort segments by score desc.
2. Accept only if midpoint ≥45 s from every already-accepted segment.
3. If <5 with 45 s spread, relax to 30 s and retry.
4. If still <5, fill from highest-score regardless of spread.
5. Re-sort by start time.

### 1.5 trimSentence

Input: raw sentence text. Output: 12–25 words, ending in clause boundary.

Steps:
1. Find best start: clause starter within first 8 tokens.
2. Take up to targetWords + 6 tokens.
3. Trim trailing functional words.
4. Hard cap to targetWords + 4.
5. Add period if missing.

### 1.6 pickBlankWord

Cross-segment dedup via `usedBlanks` Set.

For each token:
- Reject: length <5 or >12, stopwords, mid-sentence Capitalized, contractions, freq >2, already used

Score:
- +4 if 6–10 chars
- +3 if content suffix (`-ing|-ed|-tion|-sion|-ness|-ment|-able|-less|-ful|-ous|-ive|-ity`)
- +3 if Minecraft theme word
- +2 if action verb base
- +2 if mid-position (25%–85% index)

### 1.7 pickDistractors

Per-segment-seeded (same blank in two videos → different distractors).

Pool composition (3 distractors):
- 2 from curated **GLOBAL_DISTRACTOR_POOL** (~80 ESL B1/B2 words)
- 1 from this video's transcript (content words ≠ blank, length 5–10)

Filtering: different from blank, lesson-wide dedup, different morphological root.

### 1.8 Tuning tips (Listening)

- **Easier**: Increase BOILERPLATE penalty, lower trimSentence upper bound to 20.
- **Harder**: Raise minimum blank word length to 6, bias toward `-tion|-able|-ous`.
- **More segments**: Change `chooseSegments(…, 5)` — max 8.

---

## Part 2: Reading Course — Paragraph Extraction + Multi-Type Quizzes

Source: `react-vite/scripts/generate-reading-courses.mjs`, `reading-enrich-plan.mjs`, `reading-enrich-apply.mjs`

### 2.1 Pipeline overview

```
Listening Course JSON (transcript_en, transcript_zh)
  → generate-reading-courses.mjs: scaffold + enrichment input
  → reading-enrich-plan.mjs: structured LLM prompt
  → Agent (inline): paragraph extraction + quiz generation
  → reading-enrich-apply.mjs: validate + assemble final JSON
  → reading-bundle.mjs: bundle for Admin Bulk Import
```

### 2.2 Paragraph extraction strategy

**Source material**: Full English transcript (3000-5000 words of spoken text)

**Extraction goals**:
- Identify 3-5 **narrative peaks** — moments with highest teaching value
- Prefer: actions, discoveries, crafting, problem-solving
- Avoid: intros/outros, repetitive gameplay narration, filler speech

**Rewriting rules** (content is REWRITTEN, not copied verbatim):
- Spoken transcripts have grammar issues → reading needs well-formed prose
- Each paragraph: 50-100 words, complete sentences, 2-3 **bolded vocabulary words**
- Maintain chronological story order, preserve Minecraft adventure voice

### 2.3 Difficulty calibration

| Level | Segments | Vocabulary | Sentences | Grammar |
|---|---|---|---|---|
| 1 (Beginner) | 3 | Common (5-7 letters) | Simple S+V+O, max 15 words | Present + simple past only |
| 2 (Intermediate) | 4 | Moderate (6-9 letters) | Compound okay, max 20 words | Varied tenses, conditional, passive |
| 3 (Advanced) | 5 | Advanced (7-12 letters) | Complex, max 25 words | Relative clauses, subjunctive |

**Auto-detection via --from-import**:
- `<6 min` video → difficulty 1
- `6-12 min` → difficulty 2
- `>12 min` → difficulty 3

### 2.4 Quiz type specifications

**vocabulary_cloze**:
- `blank_word`: one of the **bolded** words
- `distractors`: 3 words, similar difficulty, same part of speech preferred
- Don't use words that could be correct in context

**comprehension**:
- `prompt`: factual question about paragraph content
- `options`: 4 distinct answers, only one correct
- Avoid "all of the above" / "none of the above"

**true_false**:
- `statement`: declarative sentence, clearly true OR false
- `correct`: boolean
- Use paraphrased language, not verbatim

**word_match**:
- `pairs`: 3-4 word-definition pairs from paragraph
- `shuffled_defs`: same definitions in different order
- Definitions: simple, child-friendly (10-15 words max)

**sentence_order**:
- `sentences`: 3-4 logically orderable sentences
- `correct_order`: array of indices (always sequential for correct)

### 2.5 Quiz type assignment

| Position | Beginner (3 seg) | Intermediate (4 seg) | Advanced (5 seg) |
|---|---|---|---|
| Seg 0 | vocabulary_cloze | vocabulary_cloze | vocabulary_cloze |
| Seg 1 | comprehension | comprehension | comprehension |
| Seg 2 | true_false | word_match | word_match |
| Seg 3 | — | true_false | sentence_order |
| Seg 4 | — | — | vocabulary_cloze |

### 2.6 Chinese translation guidelines

- Translate full meaning, not word-by-word
- Keep Minecraft proper nouns untranslated: Minecraft, Creeper, Steve, Ender Dragon
- Use accepted Chinese community terms:
  - diamond → 钻石, obsidian → 黑曜石, pickaxe → 镐
  - skeleton → 骷髅, zombie → 僵尸, creeper → 苦力怕
  - enchanting → 附魔, nether → 下界, portal → 传送门

### 2.7 Tuning tips (Reading)

- **Easier**: Reduce paragraphs to 40-70 words, use 1000-word vocabulary.
- **Harder**: Increase to 80-120 words, add idioms, complex grammar.
- **More variety**: Swap qtype assignments in `assignQtypes()`.

---

## Part 3: Vocabulary Course — Flashcard Generation

Source: `react-vite/scripts/extract-vocab-words.mjs`, `generate-vocab-courses.mjs`

### 3.1 Pipeline overview

```
VTT subtitle files
  → extract-vocab-words.mjs: word frequency analysis + MC term tagging
  → Agent: select 6-8 key words per theme, generate rich flashcard data
  → Generate vocab SQL (UPSERT into vocab table)
  → Generate vocab course JSON (kind: 'vocabulary', lesson kind: 'vocab_drill')
  → Bundle + Admin Bulk Import
```

### 3.2 Word selection criteria

From `extract-vocab-words.mjs`:
- Filter: ≥3 chars, not in STOP_WORDS set (~200 common words)
- Flag Minecraft terms from MC_TERMS set (~170 game-specific words)
- Sort by frequency descending
- Keep: freq ≥3 OR is MC term

For **themed courses**, group by category:
- Hostile Mobs, Friendly Animals, Tools & Weapons
- Precious Resources, Food & Cooking, Nature & Landscape
- Nether & End, Crafting & Machines, Action Verbs, Describing Words

### 3.3 Flashcard data structure

Each vocab entry needs:

| Field | Description |
|---|---|
| `id` | Unique slug (e.g., `diamond`) |
| `word` | The English word |
| `pos` | Part of speech: `noun`, `verb`, `adj` |
| `definition_en` | Clear English definition (1-2 sentences) |
| `definition_zh` | Chinese translation |
| `example_en` | Example sentence using the word in Minecraft context |
| `example_zh` | Chinese translation of example |
| `pixel_icon` | Icon key: `mob`, `sword`, `blocks`, `enchant` |
| `synonyms` | Array of 2 English synonyms |
| `minecraft_role` | How it works in Minecraft (1-2 sentences) |
| `minecraft_obtain` | How to get/find it in Minecraft |

### 3.4 Vocab course JSON structure

```json
{
  "course": {
    "id": "vocab-<theme>",
    "kind": "vocabulary",
    "title": "<Theme>",
    "description": "...",
    "difficulty": 2,
    "sort_order": 101-110
  },
  "lesson": {
    "kind": "vocab_drill",
    "highlight_words": ["word1", ..., "word8"]
  },
  "segments": []
}
```

The `highlight_words` array references entries in the `vocab` table.
The VocabCard component fetches details from the vocab table at runtime.

### 3.5 Difficulty constraints

The `courses` table has a CHECK constraint: `difficulty IN (1, 2, 3)`.
Never set difficulty to 4 or higher.

### 3.6 Tuning tips (Vocabulary)

- **For a single video**: Extract 6-8 words that best represent the video's theme
- **For a playlist**: Group into thematic courses of 6-10 words each
- **Icon selection**: `mob` for creatures, `sword` for tools/combat, `blocks` for building/nature, `enchant` for magic/rare items
