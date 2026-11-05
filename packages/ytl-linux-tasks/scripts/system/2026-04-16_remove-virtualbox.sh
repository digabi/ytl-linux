#!/bin/sh
set -e

PKG_TO_HAVE_REQUIRED_VERSION="ytl-linux-customize-24"
REQUIRED_MIN_VERSION="1.3.0"

PKG_TO_REMOVE="virtualbox-7.1"

version_lt() {
  if command -v dpkg >/dev/null 2>&1; then
    dpkg --compare-versions "$1" lt "$2"
    return $?
  fi
  # fallback: lexicographic sort of versions
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Check if we have installed package version which removes Naksu 1
INSTALLED_VERSION="$(dpkg-query -W -f='${Status} ${Version}\n' "$PKG_TO_HAVE_REQUIRED_VERSION" 2>/dev/null | awk '/install ok installed/ {print $4}')"

if version_lt "$INSTALLED_VERSION" "$REQUIRED_MIN_VERSION"; then
    echo "$PKG_TO_HAVE_REQUIRED_VERSION is not updated to at least $REQUIRED_MIN_VERSION, exiting"
    exit 0
fi

# Check if package is installed
if dpkg-query -W -f='${Status}' "$PKG_TO_REMOVE" 2>/dev/null | grep -q "install ok installed"; then
  echo "Removing $PKG_TO_REMOVE..."
  DEBIAN_FRONTEND=noninteractive apt-get --yes purge "$PKG_TO_REMOVE"
  DEBIAN_FRONTEND=noninteractive apt-get --yes autopurge
  echo "$PKG_TO_REMOVE removed."
fi
