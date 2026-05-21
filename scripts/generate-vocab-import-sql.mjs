#!/usr/bin/env node
/**
 * generate-vocab-import-sql.mjs
 *
 * Generates SQL for importing vocabulary courses + lessons into Supabase.
 * Output: supabase-migration/16_seed_vocab_course_structure.sql
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const bundlePath = path.join(ROOT, 'course-data/courses/_vocab-bundle.json')
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))

function esc(s) { return (s || '').replace(/'/g, "''") }

let sql = `-- =============================================================================
-- 16 — Seed vocabulary course structures: ${bundle.length} courses + lessons
--
-- Inserts vocabulary courses and their vocab_drill lessons.
-- Uses ON CONFLICT DO UPDATE for idempotency.
-- =============================================================================

`

for (const item of bundle) {
  const c = item.course
  const l = item.lesson
  const lessonId = `${c.id}-lesson-0`

  sql += `-- Course: ${c.title}
INSERT INTO public.courses (id, kind, title, description, difficulty, est_minutes, xp_reward, unlock_level, source_label, source_url, source_license, sort_order, is_active)
VALUES (
  '${esc(c.id)}', '${esc(c.kind)}', '${esc(c.title)}', '${esc(c.description)}',
  ${c.difficulty}, ${c.est_minutes}, ${c.xp_reward}, ${c.unlock_level},
  '${esc(c.source_label)}', '${esc(c.source_url || '')}', '${esc(c.source_license)}',
  ${c.sort_order}, ${c.is_active}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, est_minutes = EXCLUDED.est_minutes,
  xp_reward = EXCLUDED.xp_reward, unlock_level = EXCLUDED.unlock_level,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO public.lessons (id, course_id, step_index, kind, title, highlight_words, xp_reward)
VALUES (
  '${esc(lessonId)}', '${esc(c.id)}', 0, 'vocab_drill', '${esc(l.title)}',
  ARRAY[${l.highlight_words.map(w => `'${esc(w)}'`).join(', ')}],
  ${l.xp_reward}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, highlight_words = EXCLUDED.highlight_words,
  xp_reward = EXCLUDED.xp_reward;

`
}

const outPath = path.join(ROOT, 'supabase-migration/16_seed_vocab_course_structure.sql')
fs.writeFileSync(outPath, sql)
console.log(`✓ SQL written: ${outPath}`)
console.log(`  ${bundle.length} courses + ${bundle.length} lessons`)
