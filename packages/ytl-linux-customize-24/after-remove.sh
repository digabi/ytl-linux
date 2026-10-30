#!/usr/bin/env bash

set -euo pipefail

# Reset "Start" menu logo to default
dconf reset /org/cinnamon/app-menu-icon-name

# Apply dconf changes
dconf update
