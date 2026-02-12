#!/usr/bin/env bash

set -euo pipefail

echo "Running connectivity tests..."
if ! ./test-connections.sh; then
  echo
  echo "Connectivity tests reported failures (see summary below)."
fi

latest_log=$(ls -t naksu2-network-test-*.log 2>/dev/null | head -n 1 || true)

if [[ -z "$latest_log" ]]; then
  echo "Error: no network test log files found." >&2
  exit 1
fi

echo "Generating HTML report from: $latest_log"
./network-log-to-html.sh "$latest_log"

html_file="${latest_log}.html"

if [[ ! -f "$html_file" ]]; then
  echo "Error: expected HTML report not found: $html_file" >&2
  exit 1
fi

echo "Opening HTML report: $html_file"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$html_file" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$html_file" >/dev/null 2>&1 || true
else
  echo "Could not auto-open the report. Please open this file in a browser:"
  echo "  $html_file"
fi

