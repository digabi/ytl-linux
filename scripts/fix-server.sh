#!/usr/bin/env bash

set -euo pipefail

## Pin containerd and docker to specific versions to avoid broken updates
sudo tee /etc/apt/preferences.d/ytl-linux-pin-containerd-to-v1 << 'EOF'
Package: containerd.io
Pin: version 1.7.28-1*
Pin-Priority: 999
EOF

sudo tee /etc/apt/preferences.d/ytl-linux-pin-docker-to-v28 << 'EOF'
Package: docker-ce docker-ce-cli
Pin: version 5:28.5.2-1*
Pin-Priority: 999
EOF

## Reinstall specific versions of containerd and docker
sudo apt install --reinstall --allow-downgrades --yes \
  docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
  docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
  containerd.io=1.7.28-1~ubuntu.24.04~noble
