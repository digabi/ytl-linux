#!/usr/bin/env bash
set -euo pipefail

DNSMASQ_CONFIG_FILE="/etc/dnsmasq.d/ytl-linux.conf"

wan="$1"
lan="$2"

if ! ip link show "$wan" >/dev/null 2>&1; then
    echo "ERROR WAN device '$wan' does not exist" >&2
    exit 1
fi

if ! ip link show "$lan" >/dev/null 2>&1; then
    echo "ERROR LAN device '$lan' does not exist" >&2
    exit 1
fi

echo "INFO Removing internet access for clients on $lan via $wan"

while sudo iptables -t nat -C POSTROUTING -o "$wan" -j MASQUERADE 2>/dev/null; do
    sudo iptables -t nat -D POSTROUTING -o "$wan" -j MASQUERADE
done

while sudo iptables -C FORWARD -i "$lan" -o "$wan" -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$lan" -o "$wan" -j ACCEPT
done

while sudo iptables -C FORWARD -i "$wan" -o "$lan" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$wan" -o "$lan" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
done

echo "INFO Enabling null route in dnsmasq configuration file ${DNSMASQ_CONFIG_FILE}"
sudo sed -i 's/^# address=\/#\/0\.0\.0\.0$/address=\/#\/0.0.0.0/' "${DNSMASQ_CONFIG_FILE}"

echo "INFO Restarting dnsmasq"
sudo systemctl restart dnsmasq.service

echo "INFO Done"