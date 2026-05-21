#!/usr/bin/env node
/**
 * fetch-meta.mjs — Step 1 of the import-youtube-course skill.
 *
 * Input:  one CLI arg, any of
 *   - https://www.youtube.com/watch?v=<ID>
 *   - https://youtu.be/<ID>
 *   - https://www.youtube.com/playlist?list=<LIST_ID>
 *   - https://www.youtube.com/watch?v=<ID>&list=<LIST_ID>  (treated as playlist)
 *   - bare 11-char video id
 *
 * Output: course-data/_skill-import.json with shape
 *   {
 *     "source": "<original_input>",
 *     "captured_at": "<iso>",
 *     "videos": [{ "i": <1-based>, "id": "<yt_id>", "title": "...", "dur": "MM:SS" }]
 *   }
 *
 * The "i" field is taken from the playlist position when available, else 1.
 * Existing course-data/youtube-listening-playlist.json is consulted to keep
 * "i" stable when re-importing a video that was already part of the canonical
 * Minecraft playlist (so sort_order stays consistent).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const OUT_PATH = path.join(ROOT, 'course-data', '_skill-import.json')
const CANONICAL_PLAYLIST = path.join(ROOT, 'course-data', 'youtube-listening-playlist.json')

const input = process.argv[2]
if (!input) {
  console.error('Usage: fetch-meta.mjs <youtube_url_or_id>')
  process.exit(2)
}

function classify(s) {
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { kind: 'video', url: `https://www.youtube.com/watch?v=${s}` }
  if (/[?&]list=/.test(s)) return { kind: 'playlist', url: s }
  if (/youtube\.com\/playlist/.test(s)) return { kind: 'playlist', url: s }
  if (/youtu\.be\/[A-Za-z0-9_-]{11}/.test(s)) return { kind: 'video', url: s }
  if (/youtube\.com\/watch\?v=/.test(s)) return { kind: 'video', url: s }
  console.error(`[fatal] cannot classify input: ${s}`)
  process.exit(2)
}

function ytdlp(args) {
  try {
    return execFileSync('yt-dlp', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (e) {
    console.error('[fatal] yt-dlp failed:', e.message)
    if (e.stdout) console.error(e.stdout.toString().slice(-500))
    if (e.stderr) console.error(e.stderr.toString().slice(-500))
    process.exit(1)
  }
}

function fmtDur(seconds) {
  const s = Math.round(seconds || 0)
  const m = Math.floor(s / 60)
  const r = String(s % 60).padStart(2, '0')
  return `${m}:${r}`
}

// Build a stable id->i map from canonical playlist so re-imports keep sort_order
const canonicalIndex = new Map()
if (fs.existsSync(CANONICAL_PLAYLIST)) {
  try {
    const c = JSON.parse(fs.readFileSync(CANONICAL_PLAYLIST, 'utf8'))
    for (const v of c.videos || []) canonicalIndex.set(v.id, v.i)
  } catch {}
}

const { kind, url } = classify(input)
console.error(`[info] kind=${kind}  url=${url}`)

let videos = []

const COOKIES = ['--cookies-from-browser', 'chrome']
// Use a sentinel that cannot appear in titles, since YouTube titles often
// contain tabs/pipes/quotes. yt-dlp will print the format literally.
const SEP = '|||SEP|||'

if (kind === 'video') {
  // single video — use --print to grab id/title/duration in one call
  const out = ytdlp([...COOKIES, '--no-warnings', '--print', `%(id)s${SEP}%(title)s${SEP}%(duration)s`, '--skip-download', url]).trim()
  const [id, title, dur] = out.split(SEP)
  if (!id) {
    console.error('[fatal] empty id from yt-dlp single-video probe')
    process.exit(1)
  }
  videos.push({
    i: canonicalIndex.get(id) || 1,
    id,
    title: title || id,
    dur: fmtDur(Number(dur)),
  })
} else {
  // playlist — flat-playlist for fast metadata of every entry
  const out = ytdlp([...COOKIES, '--no-warnings', '--flat-playlist', '--print', `%(playlist_index)s${SEP}%(id)s${SEP}%(title)s${SEP}%(duration)s`, url]).trim()
  const lines = out.split('\n').filter(Boolean)
  for (const line of lines) {
    const [idxStr, id, title, dur] = line.split(SEP)
    if (!id || id.length !== 11) continue
    const playlistI = Number(idxStr) || videos.length + 1
    videos.push({
      i: canonicalIndex.get(id) || playlistI,
      id,
      title: title || id,
      dur: fmtDur(Number(dur)),
    })
  }
}

if (videos.length === 0) {
  console.error('[fatal] no videos extracted')
  process.exit(1)
}

const payload = {
  source: input,
  captured_at: new Date().toISOString(),
  videos,
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2))
console.error(`[ok] wrote ${OUT_PATH}  (${videos.length} video${videos.length > 1 ? 's' : ''})`)
for (const v of videos.slice(0, 5)) {
  console.error(`     [${v.i}] ${v.id}  ${v.dur}  ${v.title.slice(0, 70)}`)
}
if (videos.length > 5) console.error(`     ... and ${videos.length - 5} more`)
