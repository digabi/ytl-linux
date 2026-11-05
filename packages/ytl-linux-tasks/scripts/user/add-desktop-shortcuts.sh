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

copy-shortcut-to-desktop() {
  local SOURCE="$1"
  local TARGET="$2"

  if ! cp "$SOURCE" "$TARGET"; then
    echo "Error: Failed to copy $SOURCE to $TARGET"
    return
  fi

  if ! chown "$USER:$USER" "$TARGET"; then
    echo "Error: Failed to change ownership of $TARGET to $USER:$USER"
    return
  fi

  echo "Changed ownership of $TARGET to $USER:$USER"

  if ! chmod +x "$TARGET"; then
    echo "Error: Failed to make $TARGET executable"
    return
  fi

  echo "Made $TARGET executable"
}

for source in "${SHORTCUTS_TO_ADD_TO_DESKTOP[@]}"; do
  TARGET_SHORTCUT="$HOME/Desktop/$(basename "$source")"

  if [[ ! -f "$TARGET_SHORTCUT" ]]; then
    echo "Shortcut $source does not exist on the desktop, copying it there"
    copy-shortcut-to-desktop "$source" "$TARGET_SHORTCUT"
    continue
  fi

  echo "Shortcut $(basename "$source") already exists on the desktop, checking if it's different from the source"

  TARGET_CHECKSUM=$(sha256sum "$TARGET_SHORTCUT" | cut -d ' ' -f1)
  SOURCE_CHECKSUM=$(sha256sum "$source" | cut -d ' ' -f1)

  if [[ "$TARGET_CHECKSUM" != "$SOURCE_CHECKSUM" ]]; then
    echo "Source shortcut differs from target, overwriting shortcut on desktop"
    copy-shortcut-to-desktop "$source" "$TARGET_SHORTCUT"
  else
    echo "Source shortcut is the same as target, skipping update"
    continue
  fi
done
