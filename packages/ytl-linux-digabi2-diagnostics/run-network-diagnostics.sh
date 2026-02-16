#!/usr/bin/env bash

set -euo pipefail

echo "Running connectivity tests..."
if ! /usr/local/lib/ytl-linux-diagnostics/test-connections.sh; then
  echo
  echo "Connectivity tests reported failures (see summary below)."
fi

latest_log=$(ls -t exam-server-network-test-*.log 2>/dev/null | head -n 1 || true)

if [[ -z "$latest_log" ]]; then
  echo "Error: no network test log files found." >&2
  exit 1
fi

echo "Generating HTML report from: $latest_log"
/usr/local/lib/ytl-linux-diagnostics/network-log-to-html.sh "$latest_log"

html_file="${latest_log}.html"

if [[ ! -f "$html_file" ]]; then
  echo "Error: expected HTML report not found: $html_file" >&2
  exit 1
fi

echo "Opening HTML report: $html_file"

open "$html_file" >/dev/null 2>&1 || true

