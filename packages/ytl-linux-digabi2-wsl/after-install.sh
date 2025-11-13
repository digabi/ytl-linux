#!/usr/bin/env bash

set -euo pipefail

# Use SUDO_USER to get actual user because fpm after install scripts are run as root
sudo usermod -aG docker "$SUDO_USER"
su -c "xdg-settings set default-web-browser wslview.desktop" "$SUDO_USER"

echo "Starting service that downgrades docker..."
systemctl daemon-reload
(systemctl start downgrade-docker.service || true) &
