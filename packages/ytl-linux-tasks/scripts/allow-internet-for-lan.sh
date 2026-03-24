#!/usr/bin/env bash
set -euo pipefail

wan="$1"
lan="$2"

get_ipv4_cidr() {
    local dev="$1"
    ip -o -4 addr show dev "$dev" scope global | awk '{print $4; exit}'
}

get_ipv4_addr() {
    local dev="$1"
    ip -o -4 addr show dev "$dev" scope global | awk '{print $4; exit}' | cut -d/ -f1
}

if ! ip link show "$wan" >/dev/null 2>&1; then
    echo "ERROR WAN device '$wan' does not exist" >&2
    exit 1
fi

if ! ip link show "$lan" >/dev/null 2>&1; then
    echo "ERROR LAN device '$lan' does not exist" >&2
    exit 1
fi

wan_cidr="$(get_ipv4_cidr "$wan")"
lan_cidr="$(get_ipv4_cidr "$lan")"
lan_ip="$(get_ipv4_addr "$lan")"

if [[ -z "$wan_cidr" ]]; then
    echo "ERROR WAN device '$wan' has no global IPv4 address" >&2
    exit 1
fi

if [[ -z "$lan_cidr" ]]; then
    echo "ERROR LAN device '$lan' has no global IPv4 address" >&2
    exit 1
fi

echo "INFO WAN device: $wan ($wan_cidr)"
echo "INFO LAN device: $lan ($lan_cidr)"
echo "INFO Enabling IPv4 forwarding"

echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-router.conf >/dev/null
sudo sysctl -w net.ipv4.ip_forward=1 >/dev/null

echo "INFO Allowing internet access for clients on $lan via $wan"

sudo iptables -t nat -C POSTROUTING -o "$wan" -j MASQUERADE 2>/dev/null || \
    sudo iptables -t nat -A POSTROUTING -o "$wan" -j MASQUERADE

sudo iptables -C FORWARD -i "$lan" -o "$wan" -j ACCEPT 2>/dev/null || \
    sudo iptables -A FORWARD -i "$lan" -o "$wan" -j ACCEPT

sudo iptables -C FORWARD -i "$wan" -o "$lan" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || \
    sudo iptables -A FORWARD -i "$wan" -o "$lan" -m state --state RELATED,ESTABLISHED -j ACCEPT

echo "INFO Done"
echo "INFO Clients on $lan should use $lan_ip as their default gateway"