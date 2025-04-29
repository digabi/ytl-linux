#!/usr/bin/env bash

set -euo pipefail

if ! grep -qi "microsoft" /proc/version; then
  echo "Error: This does not appear to be a WSL installation. This package only works in WSL."
  echo "You're probably looking for this package instead: ytl-linux-digabi2" 
  exit 1
fi
