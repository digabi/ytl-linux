#!/usr/bin/env bash

set -euo pipefail

# Remove previous faulty Docker daemon configuration
if [[ -f /etc/docker/daemon.json ]]; then
  rm -f /etc/docker/daemon.json
fi

systemctl restart docker
