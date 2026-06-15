#!/usr/bin/env bash

set -euo pipefail

# Stop and disable old dnsmasq service
deb-systemd-invoke stop dnsmasq.service >/dev/null || true
deb-systemd-helper disable dnsmasq.service >/dev/null || true

systemctl daemon-reload

# Remove old NCSI service if it exists
if [[ -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service ]]; then
    systemctl stop ytl-linux-digabi2-ncsi
    systemctl disable ytl-linux-digabi2-ncsi
    rm -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service
fi

systemctl enable ytl-linux-digabi2-examnet
systemctl enable ytl-linux-digabi2-examnet-firewall.service
systemctl enable ytl-linux-digabi2-examnet-discovery.timer
systemctl enable ytl-linux-digabi2-examnet-discovery.service
systemctl enable ytl-linux-digabi2-wait-for-listen-ip.service
