#!/usr/bin/env bash

set -euo pipefail

# Remove old NCSI service if it exists
if [[ -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service ]]; then
  systemctl stop ytl-linux-digabi2-ncsi
  systemctl disable ytl-linux-digabi2-ncsi
  rm -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service
fi

systemctl stop ytl-linux-digabi2-examnet
systemctl disable ytl-linux-digabi2-examnet

systemctl daemon-reload
