#!/usr/bin/env bash

set -euo pipefail

# Remove previous faulty Docker daemon configuration
if [[ -f /etc/docker/daemon.json ]]; then
  rm -f /etc/docker/daemon.json
fi

echo "Starting service that downgrades docker..."
systemctl daemon-reload
(systemctl start downgrade-docker.service || true) &
