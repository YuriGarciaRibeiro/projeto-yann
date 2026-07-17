#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 INPUT OUTPUT [desktop|mobile]"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
PROFILE="${3:-desktop}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required."
  exit 1
fi

case "$PROFILE" in
  desktop)
    SCALE="scale='min(1920,iw)':-2"
    FPS="30"
    CRF="20"
    GOP="12"
    ;;
  mobile)
    SCALE="scale='min(960,iw)':-2"
    FPS="24"
    CRF="22"
    GOP="8"
    ;;
  *)
    echo "Profile must be desktop or mobile."
    exit 1
    ;;
esac

ffmpeg \
  -i "$INPUT" \
  -an \
  -vf "${SCALE},fps=${FPS}" \
  -c:v libx264 \
  -preset slow \
  -crf "$CRF" \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -g "$GOP" \
  -keyint_min "$GOP" \
  -sc_threshold 0 \
  "$OUTPUT"

echo "Created: $OUTPUT"
