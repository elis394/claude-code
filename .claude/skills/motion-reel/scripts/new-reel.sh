#!/bin/bash
# Scaffold a reel project from the template and make sure the toolchain works.
# usage: new-reel.sh <dest-dir>
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?usage: new-reel.sh <dest-dir>}"
mkdir -p "$DEST"
[ -e "$DEST/engine.js" ] && { echo "$DEST already has a reel; not overwriting"; exit 1; }
cp -r "$SKILL/template/." "$DEST/"
cd "$DEST"
# playwright: reuse a preinstalled Chromium when one exists (cloud sessions ship /opt/pw-browsers)
[ -d /opt/pw-browsers ] && export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
npm install --silent --no-audit --no-fund >/dev/null
node -e "require('playwright')" || { echo "playwright failed to install"; exit 1; }
# ffmpeg with libx264: system one, else a static build via pip
if ! command -v ffmpeg >/dev/null && ! python3 -c "import imageio_ffmpeg" 2>/dev/null; then
  pip install -q imageio-ffmpeg 2>/dev/null || pip install -q --break-system-packages imageio-ffmpeg
fi
echo "ready: $DEST"
