get-device-ipv4-address device:
  #!/usr/bin/env bash
  set -euo pipefail

  IP=$(ip -oneline -4 addr show scope global "{{device}}" | tr -s ' ' | tr '/' ' ' | cut -d ' ' -f4)

  if [[ -z "$IP" ]]; then
    echo "Error: Network device {{device}} does not have an IPv4 address"
    exit $EXIT_CODE_NO_IP_ON_NETWORK_DEVICE
  fi

get-lan-ip-prefix wan-ip:
    if [[ "{{wan-ip}}" =~ ^192\.168\. ]]; then echo "10.0."; else echo "192.168."; fi

configure-networkmanager connection-name interface-name ip-and-netmask:
  #!/usr/bin/env bash
  set -euo pipefail

  # Delete existing connection if such exists
  if nmcli connection show "{{connection-name}}" &> /dev/null; then
    nmcli connection delete "{{connection-name}}"
  fi

  nmcli connection add \
    type ethernet \
    ifname "{{interface-name}}" \
    con-name "{{connection-name}}" \
    ip4 "{{ip-and-netmask}}" \
    autoconnect yes \
    save yes

  nmcli connection modify "{{connection-name}}" ipv6.method disabled
  nmcli connection up "{{connection-name}}"
