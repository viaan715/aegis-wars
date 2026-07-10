#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OPENAI_API_KEY:-}" || -z "${MAPBOX_ACCESS_TOKEN:-}" ]]; then
  cat <<'MSG'
Missing Codespaces secrets.

In GitHub: profile picture -> Settings -> Codespaces -> New secret.
Create and grant this repository access to:
  OPENAI_API_KEY
  MAPBOX_ACCESS_TOKEN

Restart the codespace after adding them, then run this script again.
MSG
  exit 1
fi

read -r -p "Have you confirmed your imagery license permits AI-annotated contractor/guest plan output? Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "No setting was changed. Live generation remains disabled."
  exit 1
fi

# Do not write API secrets to disk. Codespaces supplies them as environment variables.
cat > .env <<'ENV'
# Created by codespaces-configure.sh. API secrets remain in GitHub Codespaces secrets.
IMAGERY_LICENSE_CONFIRMED=true
ENV

echo "Live generation is enabled for this Codespace."
echo "Reload the preview or use the address form."
