#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 VIDEO"
  exit 1
fi

VIDEO="$1"

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe is required."
  exit 1
fi

echo "== Stream summary =="
ffprobe \
  -v error \
  -select_streams v:0 \
  -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,bit_rate \
  -of default=noprint_wrappers=1 \
  "$VIDEO"

echo
echo "== Audio streams =="
ffprobe \
  -v error \
  -select_streams a \
  -show_entries stream=index,codec_name,channels \
  -of default=noprint_wrappers=1 \
  "$VIDEO" || true

echo
echo "== First keyframes =="
ffprobe \
  -v error \
  -select_streams v:0 \
  -skip_frame nokey \
  -show_entries frame=pts_time \
  -of csv=p=0 \
  "$VIDEO" | head -n 20
