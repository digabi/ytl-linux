#!/usr/bin/env bash

set -euo pipefail

if grep -qi "microsoft" /proc/version; then
  echo "Error: This appears to be a WSL installation. This package does not work in WSL." 
  echo "You're probably looking for this package instead: ytl-linux-digabi2-wsl" 
  exit 1
fi
