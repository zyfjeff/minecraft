#!/usr/bin/env bash
# Batch download YouTube auto-generated English subtitles for all 49 videos
# (excluding the already-downloaded #11). Uses Chrome cookies to bypass bot
# detection. Runs ~3 in parallel.
set -uo pipefail

cd "$(dirname "$0")/.."

PLAYLIST_FILE="course-data/youtube-listening-playlist.json"
OUT_DIR="course-data/subs"
mkdir -p "$OUT_DIR"
LOG="$OUT_DIR/_download.log"
: > "$LOG"

# Extract id list, skip empty
IDS=$(python3 -c "
import json
with open('$PLAYLIST_FILE') as f:
    d = json.load(f)
for v in d['videos']:
    print(v['id'])
")

download_one() {
  local vid="$1"
  local out="${OUT_DIR}/${vid}.en.vtt"
  if [[ -f "$out" && -s "$out" ]]; then
    echo "[skip] ${vid} (exists)" | tee -a "$LOG"
    return 0
  fi
  echo "[start] ${vid}" | tee -a "$LOG"
  yt-dlp \
    --cookies-from-browser chrome \
    --skip-download \
    --write-auto-sub \
    --sub-lang en \
    --sub-format vtt \
    --convert-subs vtt \
    -o "${OUT_DIR}/%(id)s.%(ext)s" \
    "https://www.youtube.com/watch?v=${vid}" \
    >> "$LOG" 2>&1
  if [[ -f "$out" ]]; then
    echo "[ok] ${vid}" | tee -a "$LOG"
  else
    echo "[fail] ${vid}" | tee -a "$LOG"
  fi
}

export -f download_one
export OUT_DIR LOG

# Use xargs for parallelism (3 at a time)
echo "$IDS" | xargs -n 1 -P 3 -I {} bash -c 'download_one "$@"' _ {}

echo "=== Summary ===" | tee -a "$LOG"
ls "$OUT_DIR"/*.en.vtt 2>/dev/null | wc -l | xargs -I {} echo "VTT files: {}" | tee -a "$LOG"
