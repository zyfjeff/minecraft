#!/usr/bin/env bash
# Retry-only script: serially download missing VTTs with rate-limit-friendly delays
set -uo pipefail
cd "$(dirname "$0")/.."

PLAYLIST_FILE="course-data/youtube-listening-playlist.json"
OUT_DIR="course-data/subs"
LOG="$OUT_DIR/_retry.log"
: > "$LOG"

IDS=$(python3 -c "
import json, os
with open('$PLAYLIST_FILE') as f:
    d = json.load(f)
for v in d['videos']:
    out = os.path.join('$OUT_DIR', v['id'] + '.en.vtt')
    if not os.path.exists(out) or os.path.getsize(out) == 0:
        print(v['id'])
")

count=$(echo "$IDS" | grep -c .)
echo "[info] Need to retry: $count" | tee -a "$LOG"

i=0
for vid in $IDS; do
  i=$((i+1))
  out="${OUT_DIR}/${vid}.en.vtt"
  echo "[${i}/${count}] ${vid}" | tee -a "$LOG"
  yt-dlp \
    --cookies-from-browser chrome \
    --skip-download \
    --write-auto-sub \
    --sub-lang en \
    --sub-format vtt \
    --convert-subs vtt \
    --sleep-requests 1 \
    -o "${OUT_DIR}/%(id)s.%(ext)s" \
    "https://www.youtube.com/watch?v=${vid}" \
    >> "$LOG" 2>&1
  if [[ -f "$out" ]]; then
    echo "  ok"
  else
    echo "  fail"
  fi
  # Pause between videos to avoid rate limit
  sleep 4
done

echo "=== Summary ===" | tee -a "$LOG"
ls "$OUT_DIR"/*.en.vtt 2>/dev/null | wc -l | xargs -I {} echo "VTT files now: {}" | tee -a "$LOG"
