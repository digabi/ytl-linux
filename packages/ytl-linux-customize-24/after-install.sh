#!/usr/bin/env bash

set -euo pipefail

# Set "Start" menu logo to YTL logo
dconf write /org/cinnamon/app-menu-icon-name "'fi.ylioppilastutkinto.ytl-linux-start-menu'"

# Apply dconf changes
dconf update
