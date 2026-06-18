#!/usr/bin/env bash

set -euo pipefail

systemctl daemon-reload

systemctl enable ytl-linux-update-check.timer
systemctl enable ytl-linux-update-check.service
systemctl start ytl-linux-update-check.timer
