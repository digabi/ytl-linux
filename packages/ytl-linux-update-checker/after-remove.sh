#!/usr/bin/env bash

set -euo pipefail

rm -f /var/lib/ytl-linux-update-check/snooze-until
rmdir /var/lib/ytl-linux-update-check 2>/dev/null || true