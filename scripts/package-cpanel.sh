#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production.local}"
DIST_DIR="$ROOT_DIR/dist"
ZIP_FILE="$DIST_DIR/farmmall-frontend-cpanel.zip"

cd "$ROOT_DIR"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "[package-cpanel] Env file not found: $ENV_FILE"
  echo "Create it from .env.example or pass ENV_FILE=/path/to/file."
  exit 1
fi

if [[ -z "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  echo "[package-cpanel] NEXT_PUBLIC_API_BASE_URL is required in $ENV_FILE"
  exit 1
fi

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "[package-cpanel] Building frontend..."
NODE_ENV=production npm run build

echo "[package-cpanel] Creating $ZIP_FILE..."
zip -qr "$ZIP_FILE" \
  .next \
  public \
  server.js \
  next.config.mjs \
  package.json \
  package-lock.json

echo "[package-cpanel] Done: $ZIP_FILE"
echo "[package-cpanel] Upload this zip to the cPanel Node app folder, unzip it there, then restart the app."
