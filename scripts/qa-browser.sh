#!/usr/bin/env bash
# Linux browser runner; uses a disposable database/API supplied by the operator.
set -euo pipefail
app_root=$(cd "$(dirname "$0")/.." && pwd)
: "${DUEWISE_QA_API_PORT:=18982}"
docker run --rm --name "duewise-browser-verification-$(date +%s)" --add-host=host.docker.internal:host-gateway \
  -v "$app_root:/work" -w /tmp/duewise/frontend \
  -e DUEWISE_QA_TEST_FILE="${DUEWISE_QA_TEST_FILE:-}" \
  -e DUEWISE_TEST_PREVIEW=1 \
  -e DUEWISE_API_PROXY_TARGET="http://host.docker.internal:$DUEWISE_QA_API_PORT" \
  -e DUEWISE_TEST_API_URL="http://host.docker.internal:$DUEWISE_QA_API_PORT/api/v1" \
  mcr.microsoft.com/playwright:v1.64.1-noble bash -lc '
    mkdir -p /tmp/duewise/frontend /tmp/duewise/docs/qa
    cp /work/frontend/package*.json /tmp/duewise/frontend/
    cp /work/frontend/*.ts /work/frontend/*.json /work/frontend/index.html /tmp/duewise/frontend/
    cp -R /work/frontend/src /work/frontend/public /work/frontend/e2e /tmp/duewise/frontend/
    npm ci --cache /tmp/npm-cache && npm run build && npx playwright test "$DUEWISE_QA_TEST_FILE"
    result=$?
    cp -R /tmp/duewise/docs/qa/. /work/docs/qa/
    mkdir -p /work/.local/browser-results
    cp -R test-results/. /work/.local/browser-results/
    exit $result'
