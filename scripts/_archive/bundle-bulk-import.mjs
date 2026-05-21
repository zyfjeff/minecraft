#!/usr/bin/env node
/**
 * Concatenates all individual course JSONs (except minecraft-i-lost-my-world,
 * which was hand-authored and already imported) into a single JSON array
 * suitable for the AdminCourseList "Bulk Import" textarea.
 *
 * Output: course-data/courses/_bulk-import.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIR = path.join(ROOT, 'course-data', 'courses')

const SKIP = new Set(['minecraft-i-lost-my-world']) // already imported manually

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .sort()

const arr = []
for (const f of files) {
  const id = f.replace(/\.json$/, '')
  if (SKIP.has(id)) {
    console.error(`[skip] ${id}`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  arr.push(data)
}

const out = path.join(DIR, '_bulk-import.json')
fs.writeFileSync(out, JSON.stringify(arr, null, 2))
console.error(`Bundled ${arr.length} course payloads into ${out}`)
console.error('Total bytes:', fs.statSync(out).size)
