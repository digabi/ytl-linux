#!/usr/bin/env bash

set -euo pipefail

# Remove previous faulty Docker daemon configuration
if [[ -f /etc/docker/daemon.json ]]; then
  rm -f /etc/docker/daemon.json
fi

## Reinstall specific versions of containerd and docker
sudo apt install --reinstall --allow-downgrades --yes \
  docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
  docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
  containerd.io=1.7.28-1~ubuntu.24.04~noble

