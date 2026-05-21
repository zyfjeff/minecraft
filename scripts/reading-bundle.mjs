#!/usr/bin/env node
/**
 * reading-bundle.mjs
 *
 * Bundles all enriched Reading course JSON files from course-data/reading/
 * into a single array suitable for Admin Bulk Import.
 *
 * Output:
 *   - course-data/reading/_reading-bundle.json (archive)
 *   - public/_skill-bundle.json (served by dev server for browser injection)
 *
 * Usage:
 *   node scripts/reading-bundle.mjs
 *   node scripts/reading-bundle.mjs --only reading-minecraft-10-animals
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const READING_DIR = path.join(ROOT, 'course-data', 'reading')
const BUNDLE_PATH = path.join(READING_DIR, '_reading-bundle.json')
const PUBLIC_PATH = path.join(ROOT, 'public', '_skill-bundle.json')

const onlyIdx = process.argv.indexOf('--only')
const onlyId = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null

// Read all reading course JSONs
const files = fs
  .readdirSync(READING_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .sort()

const arr = []
let skipped = 0

for (const f of files) {
  const id = f.replace(/\.json$/, '')
  if (onlyId && id !== onlyId) continue

  const filePath = path.join(READING_DIR, f)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  // Skip scaffolds that haven't been enriched yet (empty passage_md)
  if (!data.lesson?.passage_md || data.lesson.passage_md.trim().length < 50) {
    console.error(`[SKIP] ${id} — not yet enriched (empty passage_md)`)
    skipped++
    continue
  }

  arr.push(data)
}

if (arr.length === 0) {
  console.error('No enriched reading courses found to bundle.')
  console.error(`Skipped ${skipped} unenriched scaffold(s).`)
  process.exit(1)
}

// Write bundle
fs.writeFileSync(BUNDLE_PATH, JSON.stringify(arr, null, 2))
console.log(`Bundle written: ${BUNDLE_PATH}`)
console.log(`  ${arr.length} course(s), ${skipped} skipped`)

// Write public bundle for browser injection
fs.writeFileSync(PUBLIC_PATH, JSON.stringify(arr, null, 2))
console.log(`Public bundle written: ${PUBLIC_PATH}`)
console.log(`  Size: ${(fs.statSync(PUBLIC_PATH).size / 1024).toFixed(1)} KB`)

console.log(`\nNext step: use Admin Bulk Import at /admin to import these courses.`)
console.log(`Or use the browser-use skill to automate the import.`)
