#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs project dependencies (so lint/build work) and, when credentials are
# present, sets up the Higgsfield CLI used by the /image render workflow.
set -euo pipefail

# Only run in the remote (web) environment; local sessions manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Run asynchronously: the session starts immediately while setup continues in
# the background. Note the trade-off — Claude may briefly run before deps are
# ready. The JSON directive must be the first thing printed to stdout.
echo '{"async": true, "asyncTimeout": 300000}'

ENV_FILE="${CLAUDE_ENV_FILE:-/dev/null}"

# --- Project dependencies (Next.js / npm) ---------------------------------
# `npm install` (not `npm ci`) so the cached container layer is reused on resume.
echo "Installing npm dependencies..."
npm install --no-audit --no-fund

# --- Higgsfield CLI (optional, powers /image rendering) -------------------
# The render workflow calls the `higgsfield` CLI (nano_banana_2). The exact
# install source and auth mechanism are account-specific, so they are supplied
# via environment variables configured in the web environment settings:
#
#   HIGGSFIELD_API_KEY         (required to enable rendering)
#   HIGGSFIELD_CLI_INSTALL_CMD (e.g. "pip install <higgsfield-cli-package>")
#   HIGGSFIELD_LOGIN_CMD       (optional, e.g. "higgsfield login --token $HIGGSFIELD_API_KEY")
#
# This block never fails the session: if the key is absent or install fails,
# the rest of the session still starts; only /image rendering is unavailable.
if [ -n "${HIGGSFIELD_API_KEY:-}" ]; then
  if ! command -v higgsfield >/dev/null 2>&1; then
    if [ -n "${HIGGSFIELD_CLI_INSTALL_CMD:-}" ]; then
      echo "Installing Higgsfield CLI..."
      eval "$HIGGSFIELD_CLI_INSTALL_CMD" \
        || echo "warning: Higgsfield CLI install failed; /image render unavailable"
    else
      echo "note: HIGGSFIELD_API_KEY set but HIGGSFIELD_CLI_INSTALL_CMD not provided; skipping CLI install"
    fi
  fi

  # Persist the key so render_image.py / the CLI can authenticate this session.
  echo "export HIGGSFIELD_API_KEY=\"${HIGGSFIELD_API_KEY}\"" >> "$ENV_FILE"

  # Optional explicit login step if the CLI requires one.
  if command -v higgsfield >/dev/null 2>&1 && [ -n "${HIGGSFIELD_LOGIN_CMD:-}" ]; then
    echo "Authenticating Higgsfield CLI..."
    eval "$HIGGSFIELD_LOGIN_CMD" || echo "warning: higgsfield login failed"
  fi

  if command -v higgsfield >/dev/null 2>&1; then
    echo "Higgsfield CLI ready: $(command -v higgsfield)"
  fi
else
  echo "note: HIGGSFIELD_API_KEY not set; skipping Higgsfield CLI setup (/image render disabled)"
fi

echo "Session setup complete."
