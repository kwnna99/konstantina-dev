#!/usr/bin/env bash
# Builds the production bundle, serves it, runs Lighthouse (mobile) and
# fails if any of the four category scores is below 95.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=4173
THRESHOLD=95
OUT=./.lighthouse.json

# Use the system Chrome if CHROME_PATH is set, otherwise Playwright's chromium.
if [ -z "${CHROME_PATH:-}" ]; then
  CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
  export CHROME_PATH
fi

# Production build: no E2E hooks.
npm run build

if curl -s -o /dev/null "http://localhost:$PORT/"; then
  echo "Port $PORT is already in use; stop the other server and retry." >&2
  exit 1
fi

# Run vite directly (not through npm) so the PID we kill is the server itself.
npx vite preview --port "$PORT" --strictPort >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 50); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "The preview server exited before it was ready." >&2
    exit 1
  fi
  if curl -sf "http://localhost:$PORT/" >/dev/null; then ready=1; break; fi
  sleep 0.2
done
if [ "$ready" -ne 1 ]; then
  echo "The preview server was not ready after 10 seconds." >&2
  exit 1
fi

npx lighthouse "http://localhost:$PORT/" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path="$OUT" --quiet \
  --chrome-flags="--headless=new"

node -e '
const r = require(process.argv[1]);
const min = Number(process.argv[2]);
let failed = false;
for (const [id, c] of Object.entries(r.categories)) {
  const score = Math.round(c.score * 100);
  console.log(`${c.title}: ${score}`);
  if (score < min) failed = true;
}
if (failed) { console.error(`A score is below ${min}.`); process.exit(1); }
' "$PWD/$OUT" "$THRESHOLD"
