// =============================================================================
// YouTube IFrame Player API helper
// =============================================================================
//
// Wraps the global https://www.youtube.com/iframe_api script so React code can
// just call:
//
//   const player = await createPlayer(domNode, { videoId, start, end, onReady })
//   const stop = startPolling(player, 250, (sec) => setCurrentSec(sec))
//   ...
//   stop(); player.destroy()
//
// We never download or cache YouTube captions — playback is via the official
// IFrame embed only. The transcript shown next to the player is CraftWords'
// own A2 paraphrase (lessons.transcript_en) and is timed by linearly mapping
// sentence index over [yt_start_sec, yt_end_sec].
// =============================================================================

const SCRIPT_ID = 'youtube-iframe-api'
let apiReadyPromise = null

// Lazily inject the IFrame API <script> exactly once and return a promise that
// resolves when window.YT.Player is callable.
export function loadYouTubeIframeAPI() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadYouTubeIframeAPI: no window'))
  }
  if (window.YT && typeof window.YT.Player === 'function') {
    return Promise.resolve(window.YT)
  }
  if (apiReadyPromise) return apiReadyPromise

  apiReadyPromise = new Promise((resolve, reject) => {
    // Chain onto any existing onYouTubeIframeAPIReady the host page may have set.
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = function patchedReady() {
      try { if (typeof prev === 'function') prev() } catch (e) { /* swallow */ }
      if (window.YT && typeof window.YT.Player === 'function') {
        resolve(window.YT)
      } else {
        reject(new Error('YouTube IFrame API loaded but window.YT.Player missing'))
      }
    }

    let script = document.getElementById(SCRIPT_ID)
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'))
      document.head.appendChild(script)
    }
  })
  return apiReadyPromise
}

// Create a YT.Player bound to the given DOM node. Returns a promise that
// resolves with the player once onReady has fired. Caller owns destruction.
//
//   options:
//     videoId       string  required — YouTube video id, e.g. 'dQw4w9WgXcQ'
//     start         number  optional — clip start in seconds
//     end           number  optional — clip end in seconds
//     width         string  optional — iframe width (default '100%' so the
//                                       embed fills its responsive parent)
//     height        string  optional — iframe height (default '100%')
//     onStateChange (state) optional — forwarded YT.PlayerState code
//     onError       (code)  optional — forwarded API error code
export function createPlayer(domNode, options = {}) {
  const { videoId, start, end, width, height, onStateChange, onError } = options
  if (!domNode) return Promise.reject(new Error('createPlayer: missing domNode'))
  if (!videoId) return Promise.reject(new Error('createPlayer: missing videoId'))

  return loadYouTubeIframeAPI().then((YT) => new Promise((resolve, reject) => {
    let resolved = false
    const playerVars = {
      // Best-effort safer defaults: no related-video popover, hide branding,
      // disable keyboard so global shortcuts in the app keep working.
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      disablekb: 1,
    }
    if (typeof start === 'number' && start >= 0) playerVars.start = Math.floor(start)
    if (typeof end === 'number' && end > 0) playerVars.end = Math.floor(end)

    let player
    try {
      player = new YT.Player(domNode, {
        // Default to '100%' so the iframe stretches to fill the parent
        // container instead of YT's hard-coded 640x360 attribute. The parent
        // is responsible for aspect ratio (e.g. via aspectRatio: 16/9).
        width: width != null ? width : '100%',
        height: height != null ? height : '100%',
        videoId,
        playerVars,
        events: {
          onReady: () => {
            if (resolved) return
            resolved = true
            resolve(player)
          },
          onStateChange: (e) => {
            if (typeof onStateChange === 'function') onStateChange(e.data)
          },
          onError: (e) => {
            if (typeof onError === 'function') onError(e.data)
            if (!resolved) {
              resolved = true
              reject(new Error(`YouTube player error code ${e.data}`))
            }
          },
        },
      })
    } catch (err) {
      reject(err)
    }
  }))
}

// Poll the player's currentTime every `intervalMs` and pipe it into `onTick`.
// Returns a stop() function that cancels the interval. Safe to call after
// player has been destroyed (the next tick will throw and be swallowed).
export function startPolling(player, intervalMs, onTick) {
  if (!player) return () => {}
  const id = setInterval(() => {
    try {
      if (typeof player.getCurrentTime === 'function') {
        const t = player.getCurrentTime()
        if (typeof t === 'number' && Number.isFinite(t)) onTick(t)
      }
    } catch (e) {
      // player likely destroyed — let the caller's stop() clean up.
    }
  }, Math.max(50, intervalMs || 250))
  return () => clearInterval(id)
}

// Split a transcript paragraph into sentences and assign each a [start, end]
// timing window by linearly mapping over [clipStart, clipEnd]. Used to drive
// the "current sentence" highlight without storing real caption timestamps.
//
// Returns: [{ index, text, start, end }]
export function buildTranscriptLines(transcriptText, clipStart, clipEnd) {
  const text = (transcriptText || '').trim()
  if (!text) return []
  // Split on sentence-ending punctuation, keep the punctuation attached to the
  // preceding sentence so the rendered line still reads like a sentence.
  const raw = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (raw.length === 0) return []

  const start = Math.max(0, Number(clipStart) || 0)
  const end = Math.max(start + raw.length, Number(clipEnd) || (start + raw.length * 4))
  const span = (end - start) / raw.length
  return raw.map((line, i) => ({
    index: i,
    text: line,
    start: start + span * i,
    end: start + span * (i + 1),
  }))
}

// Find which transcript line a given currentTime second falls into. Returns
// -1 when before the first line. Linear scan is fine for <100 lines.
export function findActiveLine(lines, currentSec) {
  if (!Array.isArray(lines) || lines.length === 0) return -1
  for (let i = 0; i < lines.length; i += 1) {
    if (currentSec < lines[i].end) return i
  }
  return lines.length - 1
}
