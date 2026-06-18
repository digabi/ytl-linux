#!/usr/bin/env bash

set -euo pipefail

systemctl stop ytl-linux-update-check.timer
systemctl disable ytl-linux-update-check.timer

systemctl stop ytl-linux-update-check.service
systemctl disable ytl-linux-update-check.service

systemctl daemon-reload
