#!/usr/bin/env bash
set -euo pipefail

PORTS=(3000 3001 3002 3003 3004 3005)

kill_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    return 0
  fi

  echo "Killing processes listening on port ${port}: ${pids}"
  kill ${pids} 2>/dev/null || true

  local deadline=$((SECONDS + 3))
  while (( SECONDS < deadline )); do
    if ! lsof -ti "tcp:${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done

  pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Force killing processes still listening on port ${port}: ${pids}"
    kill -9 ${pids} 2>/dev/null || true
  fi
}

echo "Stopping existing dev servers..."
for port in "${PORTS[@]}"; do
  kill_port "${port}"
done

echo "Starting all dev servers..."
exec pnpm exec concurrently \
  "pnpm --filter vendure-boilerplate dev" \
  "pnpm --filter nextjs-starter-vendure dev" \
  "pnpm -C zkey-dashboard dev" \
  "PORT=3002 pnpm -C zkey-service start:dev" \
  "PORT=3005 pnpm -C booking-service start:dev" \
  "pnpm --filter api-gateway start:dev" \
  --kill-others \
  --names "VENDURE,STOREFRONT,ZKEY_DASH,ZKEY_SVC,BOOKING,GATEWAY" \
  --prefix-colors "blue,magenta,cyan,green,red,yellow"
