#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="/usr/local/lib/ytl-linux-diagnostics"
cd "$SCRIPT_DIR"
exec ./run-network-diagnostics.sh "$@"

