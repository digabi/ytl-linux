#!/usr/bin/env bash

set -euo pipefail

while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/dpkg/lock >/dev/null 2>&1; do
    echo "Another process is using apt/dpkg, waiting..."
    sleep 5
done

# Reinstall specific versions of containerd and docker
echo "Downgrading docker..."
sudo apt install --reinstall --allow-downgrades --yes \
            docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
            docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
            containerd.io=1.7.28-1~ubuntu.24.04~noble

echo "Docker is downgraded."