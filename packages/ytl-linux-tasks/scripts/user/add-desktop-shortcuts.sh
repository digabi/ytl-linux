#!/usr/bin/env bash
# This script is ran on every boot as the school user and adds relevant shortcuts to the desktop

set -euo pipefail

SHORTCUTS_TO_ADD_TO_DESKTOP=(
  "/var/lib/snapd/desktop/applications/firefox_firefox.desktop"
  "/usr/share/applications/anydesk-meb.desktop"
  "/usr/share/applications/answers-backups.desktop"
  "/usr/share/applications/naksu2.desktop"
  "/usr/share/applications/org.gnome.Screenshot.desktop"
  "/usr/share/applications/ytl-linux-update-checker.desktop"
)

for shortcut in "${SHORTCUTS_TO_ADD_TO_DESKTOP[@]}"; do
  if ! cp "$shortcut" "$HOME/Desktop"; then
    echo "Error: Failed to copy $shortcut to $HOME/Desktop"
  fi

  echo "Copied $shortcut to $HOME/Desktop"
done

for shortcut in $HOME/Desktop/*.desktop; do
  if ! chown $USER:$USER "$shortcut"; then
    echo "Error: Failed to change ownership of $shortcut to $USER:$USER"
  fi

  echo "Changed ownership of $shortcut to $USER:$USER"

  if ! chmod +x "$shortcut"; then
    echo "Error: Failed to make $shortcut executable"
  fi

  echo "Made $shortcut executable"
done
