#!/usr/bin/env bash
set -euo pipefail

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

while sudo iptables -C FORWARD -i "$wan" -o "$lan" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$wan" -o "$lan" -m state --state RELATED,ESTABLISHED -j ACCEPT
done

echo "INFO Disabling IPv4 forwarding"
echo 'net.ipv4.ip_forward=0' | sudo tee /etc/sysctl.d/99-router.conf >/dev/null
sudo sysctl -w net.ipv4.ip_forward=0 >/dev/null

echo "INFO Done"