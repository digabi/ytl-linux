#!/usr/bin/env bash

set -euo pipefail

# Remove previous faulty Docker daemon configuration
rm -f /etc/docker/daemon.json
