#!/usr/bin/env bash

set -euo pipefail

systemctl enable ytl-linux-update-check.timer
systemctl enable ytl-linux-update-check.service
