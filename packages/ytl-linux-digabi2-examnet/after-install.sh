#!/usr/bin/env bash

set -euo pipefail

systemctl daemon-reload

# Remove old NCSI service if it exists
if [[ -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service ]]; then
    systemctl stop ytl-linux-digabi2-ncsi
    systemctl disable ytl-linux-digabi2-ncsi
    rm -f /etc/systemd/system/ytl-linux-digabi2-ncsi.service
fi

# Ensure dnsmasq remains stopped until network settings are configured, but don't turn it off if it's in use
if [[ ! -f /etc/dnsmasq.d/ytl-linux.conf ]]; then
    systemctl disable --now dnsmasq
fi

systemctl enable ytl-linux-digabi2-examnet
