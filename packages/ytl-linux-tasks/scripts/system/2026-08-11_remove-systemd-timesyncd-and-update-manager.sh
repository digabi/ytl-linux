#!/usr/bin/env bash

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

PACKAGES_TO_REMOVE=("systemd-timesyncd" "update-manager" "update-notifier" "ubuntu-release-upgrader-gtk")

for package in "${PACKAGES_TO_REMOVE[@]}"; do
    if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q "install ok installed"; then
        echo "Removing $package..."
        apt-get --yes remove "$package"
        apt-get --yes autoremove
        echo "$package removed."
    fi
done
