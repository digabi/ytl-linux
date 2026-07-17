#!/usr/bin/env bash

set -euo pipefail

systemctl daemon-reload

systemctl enable --now ytl-linux-update-check.timer
