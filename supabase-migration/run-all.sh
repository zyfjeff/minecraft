#!/usr/bin/env bash
# =============================================================================
# CraftWords — one-shot migration runner for a self-hosted Supabase instance.
#
# Usage:
#   export DATABASE_URL="postgresql://postgres:<pwd>@<host>:5432/postgres"
#   ./run-all.sh
#
# Or override the connection per call:
#   DATABASE_URL="postgres://..." ./run-all.sh
#
# Behavior:
#   - Executes every *.sql in this directory in lexicographic (numeric prefix)
#     order, with `psql -v ON_ERROR_STOP=1`.
#   - Stops on the first failing statement and reports the file + line.
#   - Idempotent: re-running is safe (all DDL uses IF NOT EXISTS / OR REPLACE).
# =============================================================================
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "       export DATABASE_URL=\"postgresql://postgres:<pwd>@<host>:5432/postgres\"" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is not installed or not on PATH." >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Running CraftWords migration against:"
# Strip the password from DATABASE_URL for the banner
printf '    %s\n' "${DATABASE_URL%%:*}://***@${DATABASE_URL##*@}"
echo

for f in "$HERE"/[0-9][0-9]_*.sql; do
  name="$(basename "$f")"
  echo "--> $name"
  psql "$DATABASE_URL" \
       -v ON_ERROR_STOP=1 \
       --single-transaction \
       --quiet \
       -f "$f"
done

echo
echo "==> All migrations applied successfully."
echo "    Next: update the front-end .env.local with the new VITE_SUPABASE_URL"
echo "    and VITE_SUPABASE_ANON_KEY, then rebuild."
