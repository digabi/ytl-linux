#!/usr/bin/env bash

set -euo pipefail

if [[ -f /etc/apt/sources.list.d/virtualbox-oracle.sources ]]; then
  echo "Found installed VirtualBox source, removing it"
  rm -f /etc/apt/sources.list.d/virtualbox-oracle.sources
fi
