#!/usr/bin/env bash
set -euo pipefail

DNSMASQ_CONFIG_FILE="/etc/dnsmasq.d/ytl-linux.conf"

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

echo "INFO Allowing internet access for clients on $lan via $wan"

sudo iptables -t nat -C POSTROUTING -o "$wan" -j MASQUERADE 2>/dev/null || \
    sudo iptables -t nat -A POSTROUTING -o "$wan" -j MASQUERADE

sudo iptables -C FORWARD -i "$lan" -o "$wan" -j ACCEPT 2>/dev/null || \
    sudo iptables -A FORWARD -i "$lan" -o "$wan" -j ACCEPT

sudo iptables -C FORWARD -i "$wan" -o "$lan" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || \
    sudo iptables -A FORWARD -i "$wan" -o "$lan" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

echo "INFO Disabling null route in dnsmasq configuration file ${DNSMASQ_CONFIG_FILE}"
sudo sed -i 's/^address=\/#\/0\.0\.0\.0$/# address=\/#\/0.0.0.0/' "${DNSMASQ_CONFIG_FILE}"

echo "INFO Restarting dnsmasq"
sudo systemctl restart dnsmasq.service

echo "INFO Done"
echo "INFO Clients on $lan should use $lan_ip as their default gateway"