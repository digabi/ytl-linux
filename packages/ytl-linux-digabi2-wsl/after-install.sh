#!/usr/bin/env bash

set -euo pipefail

# Use SUDO_USER to get actual user because fpm after install scripts are run as root
sudo usermod -aG docker "$SUDO_USER"
su -c "xdg-settings set default-web-browser wslview.desktop" "$SUDO_USER"

## Reinstall specific versions of containerd and docker
sudo apt install --reinstall --allow-downgrades --yes \
  docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
  docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
  containerd.io=1.7.28-1~ubuntu.24.04~noble
