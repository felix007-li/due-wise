#!/usr/bin/env bash
set -euo pipefail
app_root=$(cd "$(dirname "$0")/.." && pwd)
cd "$app_root"
if [[ -d "$app_root/.tools/jdk-21.0.12.1+1/Contents/Home" ]]; then
  export JAVA_HOME="$app_root/.tools/jdk-21.0.12.1+1/Contents/Home"
fi
export GRADLE_USER_HOME="$app_root/.tools/gradle-home"
export npm_config_cache="$app_root/.tools/npm-cache"
[[ -d frontend/node_modules ]] || npm ci --prefix frontend
(cd backend && ./gradlew bootRun --args='--spring.profiles.active=local') &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM
npm --prefix frontend run dev
