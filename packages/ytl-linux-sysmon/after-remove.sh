#!/usr/bin/env bash

set -euo pipefail

# We have no programmatic control for installing Snaps, so we need to do it in the postremove step
snap remove --purge bandwhich
