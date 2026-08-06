#!/usr/bin/env bash

set -euo pipefail

# Remove old versions distributed Trojan horse style inside ytl-linux-customize-24 to prevent dpkg conflicts
OLD_FILES_TO_REMOVE=(
  /usr/local/share/pixmaps/ytl-grub-safe-graphics-icon.png
  /usr/share/applications/ytl-grub-safe-graphics-on.desktop
  /usr/share/applications/ytl-grub-safe-graphics-off.desktop
  /usr/share/polkit-1/actions/ytl-grub-safe-graphics.policy
  /usr/local/sbin/ytl-grub-safe-graphics
)

for file in "${OLD_FILES_TO_REMOVE[@]}"; do
  if [[ -f "$file" ]]; then
    rm -f "$file"
  fi
done
