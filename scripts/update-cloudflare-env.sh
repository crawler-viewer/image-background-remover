#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="image-background-remover"

require_var() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "[ERROR] Missing required env var: $name" >&2
    exit 1
  fi
}

require_var CLOUDFLARE_API_TOKEN
require_var CLOUDFLARE_ACCOUNT_ID
require_var GOOGLE_CLIENT_ID
require_var GOOGLE_CLIENT_SECRET
require_var AUTH_SECRET
require_var REMOVE_BG_API_KEY

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq is required but not installed." >&2
  exit 1
fi

API_BASE="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}"
AUTH_HEADER="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"

TMP_CURRENT=$(mktemp)
TMP_PAYLOAD=$(mktemp)
trap 'rm -f "$TMP_CURRENT" "$TMP_PAYLOAD"' EXIT

echo "[INFO] Fetching current Pages project config..."
curl -fsSL \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  "$API_BASE" > "$TMP_CURRENT"

SUCCESS=$(jq -r '.success // false' "$TMP_CURRENT")
if [ "$SUCCESS" != "true" ]; then
  echo "[ERROR] Failed to read project config:" >&2
  cat "$TMP_CURRENT" >&2
  exit 1
fi

jq --arg googleId "$GOOGLE_CLIENT_ID" \
   --arg googleSecret "$GOOGLE_CLIENT_SECRET" \
   --arg authSecret "$AUTH_SECRET" \
   --arg removeBgKey "$REMOVE_BG_API_KEY" \
   '{
      deployment_configs: {
        preview: {
          env_vars: ((.result.deployment_configs.preview.env_vars // {}) + {
            GOOGLE_CLIENT_ID: { type: "plain_text", value: $googleId },
            GOOGLE_CLIENT_SECRET: { type: "secret_text", value: $googleSecret },
            AUTH_SECRET: { type: "secret_text", value: $authSecret },
            REMOVE_BG_API_KEY: { type: "secret_text", value: $removeBgKey }
          })
        },
        production: {
          env_vars: ((.result.deployment_configs.production.env_vars // {}) + {
            GOOGLE_CLIENT_ID: { type: "plain_text", value: $googleId },
            GOOGLE_CLIENT_SECRET: { type: "secret_text", value: $googleSecret },
            AUTH_SECRET: { type: "secret_text", value: $authSecret },
            REMOVE_BG_API_KEY: { type: "secret_text", value: $removeBgKey }
          })
        }
      }
    }' "$TMP_CURRENT" > "$TMP_PAYLOAD"

echo "[INFO] Updating Pages environment variables..."
curl -fsSL -X PATCH \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  --data @"$TMP_PAYLOAD" \
  "$API_BASE"

echo
echo "[INFO] Done. Re-deploy the project so the new env vars take effect."
