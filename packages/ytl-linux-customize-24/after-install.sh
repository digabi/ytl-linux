#!/usr/bin/env bash

set -euo pipefail

# Fix desktop icon permissions
chown school:school /home/school/Desktop/*.desktop

dconf update
