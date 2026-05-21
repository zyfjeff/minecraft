---
name: import-youtube-course
description: One-click import a YouTube video or playlist as three CraftWords course types — Listening, Reading, and Vocabulary. Given a YouTube URL, automatically fetches metadata, downloads subtitles, generates listening courses with cloze quizzes, creates reading courses with multi-type quizzes, extracts vocabulary for flashcard courses, enriches everything with Chinese translations, bundles all course types, and imports via Admin Bulk Import — all without user intervention. Use when the user pastes a YouTube link or says "import this video", "add this playlist", or "create courses from this YouTube video".
---

# Import YouTube Course (Unified)

**One YouTube URL → 3 course types (Listening + Reading + Vocabulary) → DB import**

This skill runs **fully autonomously** — no user intervention needed between steps.
If any step fails, diagnose and fix the issue, then continue from where it left off.

## Prerequisites

- `yt-dlp` installed (`brew install yt-dlp`); Chrome cookies available
- Vite dev server running at `http://127.0.0.1:5174` (`npm run dev -- --host 127.0.0.1 --port 5174`)
- Admin signed in at `/admin` with `zyfjeff@gmail.com`
- `browser-use` skill available (for automated Bulk Import)

## Inputs accepted

| Form | Example |
|---|---|
| watch URL | `https://www.youtube.com/watch?v=ZbBRqpCYsB0` |
| short URL | `https://youtu.be/ZbBRqpCYsB0` |
| playlist URL | `https://www.youtube.com/playlist?list=PLEeZEYCefqthVEbvWh4be-OzTNgmB5iVS` |
| raw 11-char id | `ZbBRqpCYsB0` |

## Workflow checklist

```
[ ] Phase 1 — Listening
  [ ] 1.1  Fetch metadata
  [ ] 1.2  Download subtitles
  [ ] 1.3  Generate listening course JSON (v2 algorithm)
  [ ] 1.4  Build enrichment prompt (translations + MCQ)
  [ ] 1.5  Produce enrichment output (agent does this inline)
  [ ] 1.6  Apply enrichment to course JSONs
[ ] Phase 2 — Reading
  [ ] 2.1  Generate reading scaffolds from imported listening courses
  [ ] 2.2  Build reading enrichment prompt
  [ ] 2.3  Produce reading enrichment output (agent does this inline)
  [ ] 2.4  Apply reading enrichment
[ ] Phase 3 — Vocabulary
  [ ] 3.1  Extract vocabulary candidates (generate-vocab-from-import.mjs)
  [ ] 3.2  Produce vocab enrichment output (agent does this inline)
  [ ] 3.3  Apply vocab enrichment (vocab-enrich-apply.mjs)
[ ] Phase 4 — Import
  [ ] 4.1  Unified bundle (Listening + Reading + Vocab)
  [ ] 4.2  Execute vocab SQL in Supabase (if new vocab entries)
  [ ] 4.3  Admin Bulk Import via browser-use
[ ] Phase 5 — Verify & Cleanup
  [ ] 5.1  Verify DB counts + front-end render
  [ ] 5.2  Cleanup temp files
```

Project root = `react-vite/`. Run all commands from project root.

---

## Phase 1: Listening Course

### 1.1 Fetch metadata

```bash
node .qoder/skills/import-youtube-course/scripts/fetch-meta.mjs "<URL_OR_ID>"
```

Writes `course-data/_skill-import.json`:
```json
{ "source": "<url>", "captured_at": "<iso>", "videos": [{ "i": 1, "id": "<yt_id>", "title": "...", "dur": "MM:SS" }] }
```

### 1.2 Download subtitles

```bash
bash .qoder/skills/import-youtube-course/scripts/download-subs.sh course-data/_skill-import.json
```

- Serial download with 4s delay between videos (anti rate-limit)
- Automatic retry for failures
- Idempotent: skips existing VTT files

### 1.3 Generate listening course JSONs

```bash
node scripts/generate-courses-v2.mjs --playlist course-data/_skill-import.json
```

The v2 algorithm scores segments on teaching value, trims to 12-25 words, picks 5 segments with time spread, generates cloze blanks + distractors.

Writes `course-data/courses/<course-id>.json` with empty `transcript_zh`, `sentence_zh`, and no `question`.

### 1.4 Build enrichment prompt

```bash
node .qoder/skills/import-youtube-course/scripts/enrich-plan.mjs course-data/_skill-import.json
```

Writes `course-data/_enrich-input.json` with translation + MCQ generation instructions.

### 1.5 Produce enrichment output (AGENT INLINE)

**Do NOT ask the user.** Read `course-data/_enrich-input.json` and produce `course-data/_enrich-output.json`.

For EACH task in the input, generate:

```json
{
  "results": [{
    "course_id": "<from task>",
    "transcript_zh": "完整中文翻译…",
    "segments_zh": [
      { "sort_order": 0, "sentence_zh": "中文翻译，保留 __BLANK__ 占位符" }
    ],
    "question": {
      "kind": "mcq",
      "prompt": "English question about the video?",
      "payload": { "options": ["A", "B", "C", "D"], "correct": 0 },
      "xp_reward": 10
    }
  }]
}
```

Rules:
- Keep `__BLANK__` literally in `sentence_zh`
- Don't translate Minecraft proper nouns
- Question: exactly 4 options, `correct` is index 0-3
- Don't invent facts not in transcript

### 1.6 Apply enrichment

```bash
node .qoder/skills/import-youtube-course/scripts/enrich-apply.mjs --check  # validate first
node .qoder/skills/import-youtube-course/scripts/enrich-apply.mjs          # write
```

If `--check` reports errors, fix `_enrich-output.json` and re-run.

---

## Phase 2: Reading Course

### 2.1 Generate reading scaffolds

```bash
node scripts/generate-reading-courses.mjs --from-import course-data/_skill-import.json
```

The `--from-import` flag dynamically discovers listening courses from the import plan and auto-determines difficulty:
- `<6 min` → difficulty 1, 3 segments
- `6-12 min` → difficulty 2, 4 segments
- `>12 min` → difficulty 3, 5 segments

Writes:
- `course-data/reading/reading-<course-id>.json` (scaffolds, with `thumbnail_key` auto-inferred from course id/title via `src/lib/courseThumbnails.js`)
- `course-data/_reading-enrich-input.json`

> Thumbnail mapping is centralized in [`src/lib/courseThumbnails.js`](../../src/lib/courseThumbnails.js). Both this script and the front-end CourseList consume the same `inferReadingThumbnail` rules, so newly imported reading courses always get a themed pixel icon (cave, diamond, portal, ...) instead of falling back to the generic blocks icon. If you add a new themed icon to `PixelThumbnails`, also extend `READING_RULES` in that module.

### 2.2 Build reading enrichment prompt

```bash
node scripts/reading-enrich-plan.mjs
```

Writes `course-data/_reading-enrich-prompt.json`.

### 2.3 Produce reading enrichment output (AGENT INLINE)

**Do NOT ask the user.** Read `course-data/_reading-enrich-prompt.json` and produce `course-data/_reading-enrich-output.json`.

For EACH task, generate:

```json
{
  "results": [{
    "reading_course_id": "reading-minecraft-<slug>",
    "passage_md": "Combined paragraphs with **bold** vocab words...\n\nSecond paragraph...",
    "passage_zh": "Chinese translation of full passage...",
    "highlight_words": ["word1", "word2", "word3", "word4", "word5"],
    "segments": [{
      "sort_order": 0,
      "sentence_en": "Paragraph with **bold** keywords...",
      "sentence_zh": "中文翻译...",
      "blank_word": "keyword",
      "distractors": ["wrong1", "wrong2", "wrong3"],
      "qtype": "vocabulary_cloze",
      "quiz_payload": null
    }],
    "question": {
      "kind": "mcq",
      "prompt": "Overall question about the passage?",
      "payload": { "options": ["A", "B", "C", "D"], "correct": 0 },
      "xp_reward": 10
    }
  }]
}
```

Key rules:
- Extract and REWRITE 3-5 narrative peaks into 50-100 word paragraphs
- Bold **2-3 vocabulary words** per paragraph
- Match quiz type to assigned qtype per segment:
  - `vocabulary_cloze`: blank_word (bolded) + 3 distractors
  - `comprehension`: prompt + 4 options MCQ
  - `true_false`: statement + boolean correct
  - `word_match`: pairs[] + shuffled_defs[]
  - `sentence_order`: sentences[] + correct_order[]
- Translate to Chinese (keep MC proper nouns untranslated)
- Cooldown MCQ tests overall comprehension, not a single segment

### 2.4 Apply reading enrichment

```bash
node scripts/reading-enrich-apply.mjs --check  # validate first
node scripts/reading-enrich-apply.mjs          # write
```

If `--check` reports errors, fix `_reading-enrich-output.json` and re-run.

---

## Phase 3: Vocabulary Course

### 3.1 Extract vocabulary candidates

```bash
node scripts/generate-vocab-from-import.mjs
```

This script:
- Reads `course-data/_skill-import.json` to find video IDs from the import
- Parses corresponding VTT files, extracts word frequencies
- Groups top words into 2-3 themed courses (Adventure & Survival, Building & Crafting, Nature & World, etc.)
- Writes `course-data/_vocab-candidates.json` (raw frequency data)
- Writes `course-data/_vocab-enrich-prompt.json` (structured prompt for agent)

Optional flags:
- `--from-import <path>` — custom import plan path (default: `course-data/_skill-import.json`)
- `--limit 8` — max words per course (default: 8)
- `--courses 3` — number of vocab courses to generate (default: 3)

### 3.2 Produce vocab enrichment output (AGENT INLINE)

**Do NOT ask the user.** Read `course-data/_vocab-enrich-prompt.json` and produce `course-data/_vocab-enrich-output.json`.

For EACH course in the prompt's `courses` array, generate rich flashcard data:

```json
{
  "results": [{
    "course_slug": "adventure-survival",
    "course_title": "Adventure & Survival",
    "difficulty": 2,
    "description": "Learn essential vocabulary for exploring and surviving in Minecraft.",
    "words": [{
      "id": "explore",
      "word": "explore",
      "pos": "verb",
      "definition_en": "To travel through an unknown area to learn about it.",
      "definition_zh": "探索",
      "example_en": "I need to explore this cave to find diamonds.",
      "example_zh": "我需要探索这个洞穴来寻找钻石。",
      "pixel_icon": "blocks",
      "synonyms": ["discover", "investigate"],
      "minecraft_role": "Exploring is the core of Minecraft. You explore caves, biomes, and structures to find resources and adventures.",
      "minecraft_obtain": "Just walk into new territory! Use a map or compass to track explored areas."
    }]
  }]
}
```

Key rules:
- Each word entry MUST have all 11 fields (id, word, pos, definition_en/zh, example_en/zh, pixel_icon, synonyms, minecraft_role, minecraft_obtain)
- `pixel_icon` must be one of: `mob`, `sword`, `blocks`, `enchant`
- `difficulty` must be 1-3 (DB CHECK constraint)
- `synonyms` must be an array of 2 English words
- All Chinese translations should be natural, not word-by-word
- Example sentences MUST use Minecraft context

### 3.3 Apply vocab enrichment

```bash
node scripts/vocab-enrich-apply.mjs --check  # validate first
node scripts/vocab-enrich-apply.mjs          # write
```

This script:
- Validates all vocab entries
- Writes `course-data/courses/vocab-<slug>.json` for each course (with `thumbnail_key` auto-inferred from course slug/title via `inferVocabThumbnail` in `src/lib/courseThumbnails.js`)
- Writes `course-data/_vocab-skill-entries.sql` (vocab table UPSERT SQL)
- Updates `course-data/courses/_vocab-bundle.json`

If `--check` reports errors, fix `_vocab-enrich-output.json` and re-run.

---

## Phase 4: Import

### 4.1 Unified bundle

```bash
node scripts/bundle-unified.mjs --include-vocab
```

Combines Listening + Reading + Vocabulary courses into `public/_skill-bundle.json`.

### 4.2 Execute vocab SQL (if new vocab entries)

If vocab SQL was generated in Phase 3, execute it. Options (try in order):

**Option A — Supabase SQL Editor via browser-use:**

```js
// Navigate to Supabase SQL Editor
location.href = 'https://supabase.com/dashboard/project/<PROJECT_ID>/sql/new'
```

Then paste and execute the SQL.

**Option B — Ask user to execute:**

If browser automation for Supabase dashboard fails, output the SQL file path and ask the user to execute it in Supabase SQL Editor. This is the ONLY step that MAY require user intervention.

### 4.3 Admin Bulk Import via browser-use

Use the `browser-use` skill. Steps:

```js
// 4.3.1 navigate
location.href = 'http://127.0.0.1:5174/admin'
```

Wait ~3s, then:

```js
// 4.3.2 expand "Bulk Import" panel
(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /Bulk Import/i.test(b.textContent || ''))
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  return 'panel toggle'
})()

// 4.3.3 inject JSON into <textarea> + hook dialogs
(async () => {
  const r = await fetch('/_skill-bundle.json')
  const txt = await r.text()
  const ta = document.querySelector('textarea')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
  setter.call(ta, txt)
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  ta.dispatchEvent(new Event('change', { bubbles: true }))
  window.confirm = () => true
  window.alert = (m) => { window.__lastAlert = m }
  window.__bytes = txt.length
})()

// 4.3.4 run import
(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /Run Bulk Import/i.test(b.textContent || ''))
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  return 'started'
})()
```

Poll until done (every 30s):
```js
(() => ({
  last: document.querySelector('[data-testid="bulk-import-log"]')?.innerText?.split('\n').slice(-2).join(' | '),
  alert: window.__lastAlert?.slice(0, 300),
  busy: document.body.innerText.includes('Importing'),
}))()
```

Done when `alert` contains `Bulk import finished. OK: <N>. Failed: 0`.

---

## Phase 5: Verify & Cleanup

### 5.1 Verify

```js
// DB counts
(async () => {
  const m = await import('/src/lib/supabase.js')
  const c = await m.supabase.from('courses').select('id', { count: 'exact', head: true })
  const l = await m.supabase.from('lessons').select('id', { count: 'exact', head: true })
  const s = await m.supabase.from('lesson_segments').select('id', { count: 'exact', head: true })
  window.__final = { courses: c.count, lessons: l.count, segments: s.count }
})()
```

Navigate to first imported course and verify:
- Listening: `/video/<course-id>` — shows `SEGMENT 1 / 5` and key words
- Reading: `/reading/reading-<course-id>` — shows passage with segments
- Vocabulary: `/vocab/vocab-<theme>` — shows flashcard carousel

### 5.2 Cleanup

```bash
rm -f course-data/_skill-import.json
rm -f course-data/_enrich-input.json
rm -f course-data/_enrich-output.json
rm -f course-data/_reading-enrich-input.json
rm -f course-data/_reading-enrich-prompt.json
rm -f course-data/_reading-enrich-output.json
rm -f course-data/_vocab-skill-entries.sql
rm -f public/_skill-bundle.json
```

Keep `course-data/subs/*.en.vtt`, `course-data/courses/<id>.json`, and `course-data/reading/<id>.json` as source-of-truth.

---

## Error recovery

| Error | Fix |
|---|---|
| `yt-dlp` rate limit "Sign in to confirm you're not a bot" | Wait 30s, retry. Never parallelize downloads. |
| VTT file empty after download | Retry with `--cookies-from-browser chrome`. Run `yt-dlp --cookies-from-browser chrome --version` once interactively first. |
| `generate-courses-v2.mjs` skips a video | VTT may be empty or malformed. Check `course-data/subs/<id>.en.vtt`. |
| `enrich-apply.mjs` validation fails | Fix the `_enrich-output.json` (check missing fields, wrong option count, incorrect sort_order) and re-run. |
| `reading-enrich-apply.mjs` validation fails | Fix `_reading-enrich-output.json` and re-run. |
| `courses_difficulty_check` constraint in DB | Difficulty must be 1-3. Fix course JSON difficulty value. |
| Admin Bulk Import shows `Failed: N` | Check import log for specific errors. Usually missing required fields or constraint violations. Fix course JSON and re-bundle. |
| `btn.click()` does nothing in React | Must use `dispatchEvent(new MouseEvent('click', { bubbles: true }))`. |
| `textarea.value = ...` doesn't update React state | Use native setter via `Object.getOwnPropertyDescriptor`. |
| Slug collision with existing course | Bulk Import uses UPSERT — existing rows are updated. Check if this is intended. |

## Common pitfalls

- **Serial downloads only** — YouTube rate-limits parallel requests aggressively
- **PROTECTED_IDS** — `minecraft-i-lost-my-world` is hand-authored; never overwrite
- **Enrichment is INLINE** — the agent (you) does translation + quiz generation directly, no external LLM API needed
- **Vocab SQL before Bulk Import** — vocab table entries must exist before importing vocab courses, otherwise VocabCard will show empty
- **difficulty CHECK constraint** — courses table limits difficulty to 1-3; never set 4+

## Algorithm details

See [reference.md](reference.md) for segment scoring, blank-word selection, distractor pool, reading paragraph extraction, quiz type specs, and vocabulary generation guidelines.

## Files in this skill

```
.qoder/skills/import-youtube-course/
├── SKILL.md                       # this file (unified workflow)
├── reference.md                   # algorithm internals (listening + reading + vocab)
└── scripts/
    ├── fetch-meta.mjs             # URL → _skill-import.json
    ├── download-subs.sh           # subtitles → course-data/subs/
    ├── enrich-plan.mjs            # course JSON → _enrich-input.json
    ├── enrich-apply.mjs           # _enrich-output.json → patches course JSON
    └── bundle.mjs                 # legacy listening-only bundle (kept for compat)

Shared scripts in react-vite/scripts/:
    ├── generate-courses-v2.mjs         # v2 segment scoring + cloze generation
    ├── generate-reading-courses.mjs    # reading scaffold generator (supports --from-import)
    ├── reading-enrich-plan.mjs         # reading enrichment prompt builder
    ├── reading-enrich-apply.mjs        # reading enrichment validator + applier
    ├── reading-bundle.mjs              # reading course bundler
    ├── extract-vocab-words.mjs         # VTT vocabulary extraction
    ├── generate-vocab-courses.mjs      # vocab course generator (batch mode)
    ├── generate-vocab-import-sql.mjs   # vocab course SQL generator
    ├── bundle-unified.mjs              # unified bundle (all 3 types)
    └── parse-yt-vtt.mjs                # VTT parser utility
```
