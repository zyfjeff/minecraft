#!/usr/bin/env bash
# download-subs.sh — Step 2 of the import-youtube-course skill.
#
# Reads ids from course-data/_skill-import.json and serially downloads English
# auto-generated VTT subtitles into course-data/subs/<id>.en.vtt.
#
# YouTube aggressively rate-limits parallel yt-dlp ("Sign in to confirm you're
# not a bot"), so this script is intentionally serial with --sleep-requests 1
# and a 4 s pause between videos. One automatic retry per failure at the end.
#
# Usage:
#   bash .qoder/skills/import-youtube-course/scripts/download-subs.sh \
#        course-data/_skill-import.json
#
# Idempotent: skips ids whose vtt file already exists and is non-empty.

set -uo pipefail

INPUT="${1:-course-data/_skill-import.json}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$PROJECT_ROOT"

if [[ ! -f "$INPUT" ]]; then
  echo "[fatal] input not found: $INPUT" >&2
  exit 2
fi

OUT_DIR="course-data/subs"
LOG="$OUT_DIR/_skill.log"
mkdir -p "$OUT_DIR"
: > "$LOG"

IDS=$(python3 - "$INPUT" "$OUT_DIR" <<'PY'
import json, os, sys
path, out_dir = sys.argv[1], sys.argv[2]
with open(path) as f:
    d = json.load(f)
for v in d['videos']:
    p = os.path.join(out_dir, v['id'] + '.en.vtt')
    if not os.path.exists(p) or os.path.getsize(p) == 0:
        print(v['id'])
PY
)

count=$(echo "$IDS" | grep -c . || true)
echo "[info] Need to download: $count" | tee -a "$LOG"

if [[ "$count" -eq 0 ]]; then
  echo "[ok] all subtitles already present" | tee -a "$LOG"
  exit 0
fi

download_one() {
  local vid="$1"
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
}

failed=()
i=0
for vid in $IDS; do
  i=$((i+1))
  out="${OUT_DIR}/${vid}.en.vtt"
  echo "[${i}/${count}] ${vid}" | tee -a "$LOG"
  download_one "$vid"
  if [[ -s "$out" ]]; then
    echo "  ok"
  else
    echo "  fail (will retry)"
    failed+=("$vid")
  fi
  sleep 4
done

# One retry pass for failures
if [[ ${#failed[@]} -gt 0 ]]; then
  echo "[info] retry pass: ${#failed[@]}" | tee -a "$LOG"
  still_failed=()
  for vid in "${failed[@]}"; do
    out="${OUT_DIR}/${vid}.en.vtt"
    echo "[retry] ${vid}" | tee -a "$LOG"
    download_one "$vid"
    if [[ -s "$out" ]]; then
      echo "  ok"
    else
      echo "  fail"
      still_failed+=("$vid")
    fi
    sleep 6
  done
  if [[ ${#still_failed[@]} -gt 0 ]]; then
    echo "[warn] still failing: ${still_failed[*]}" | tee -a "$LOG"
    exit 1
  fi
fi

echo "[ok] all subtitles downloaded" | tee -a "$LOG"
