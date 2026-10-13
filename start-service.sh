#!/bin/sh
set -eu

SERVICE_LIFETIME_SECONDS="${SERVICE_LIFETIME_SECONDS:-3600}"

node /app/server.js &
SERVER_PID="$!"

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "The public link will close automatically after ${SERVICE_LIFETIME_SECONDS} seconds."
timeout -s TERM "$SERVICE_LIFETIME_SECONDS" \
  cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8080 || true

echo "The lunch roulette service is now closed."
