MIN_SERVER_NUMBER := "1"
MAX_SERVER_NUMBER := "24"
SUBNETS_PER_SERVER := "10"

mod util 'util.just'
mod network 'network.just'

EXIT_CODE_CANNOT_CONFIGURE_EXAMNET := env('EXIT_CODE_CANNOT_CONFIGURE_EXAMNET')

apply net-device-wan net-device-lan server-number server-name: \
  (util::assert-envs-set EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
    "PATH_EXAMNET_CONFIG"
    "PATH_NET_DEVICE_LAN_CONF"
    "PATH_NET_DEVICE_WAN_CONF"
    "PATH_SERVER_OWN_IP"
    "PATH_SERVER_FRIENDLY_NAME_CONF"
  ) \
  (assert-server-number-valid server-number) \
  (assert-server-name-valid server-name) \
  (assert-device-exists net-device-wan) \
  (assert-device-exists net-device-lan) \
  (assert-devices-different net-device-wan net-device-lan)
  #!/usr/bin/env bash
  set -euo pipefail

  IP_LAN=$(just network get-device-ipv4-address "{{net-device-lan}}")
  IP_WAN=$(just network get-device-ipv4-address "{{net-device-wan}}" $EXIT_CODE_WAN_WITH_NO_IP)
  IP_LAN_PREFIX=$(just network get-lan-ip-prefix "$IP_WAN")
  export IP_LAN
  export IP_WAN
  export IP_LAN_PREFIX

  SERVER_HOST_NUMBER=$(({{server-number}} * {{SUBNETS_PER_SERVER}}))
  SERVER_OWN_IP="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.1"
  export SERVER_OWN_IP

  DHCP_RANGE_START="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.10"
  DHCP_RANGE_END="$IP_LAN_PREFIX$((SERVER_HOST_NUMBER + {{SUBNETS_PER_SERVER}} - 1)).254"
  export DHCP_RANGE_START
  export DHCP_RANGE_END

  NCSI_HOSTNAMES_LIST=$(cat $PATH_EXAMNET_CONFIG/ncsi-hostnames)
  export NCSI_HOSTNAMES_LIST

  just network configure-networkmanager "yo-{{net-device-lan}}" "{{net-device-lan}}" "$SERVER_OWN_IP/16"

  just setup write-examnet-config "{{net-device-wan}}" "{{net-device-lan}}" "$SERVER_OWN_IP" "{{server-name}}"

[private]
write-examnet-config net-device-wan net-device-lan server-own-ip server-name:
  just util write-file "$PATH_NET_DEVICE_LAN_CONF" "{{net-device-lan}}"
  just util write-file "$PATH_NET_DEVICE_WAN_CONF" "{{net-device-wan}}"
  just util write-file "$PATH_SERVER_OWN_IP" "{{server-own-ip}}"
  just util write-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "{{server-name}}"

[private]
assert-device-exists device:
  #!/usr/bin/env bash
  set -euo pipefail
  
  if ! ip link show "{{device}}" &> /dev/null; then
    echo "Error: Network device {{device}} does not exist"
    exit $EXIT_CODE_NO_SUCH_NETWORK_DEVICE
  fi

[private]
assert-devices-different wan-network-device lan-network-device:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ "{{wan-network-device}}" == "{{lan-network-device}}" ]]; then
    echo "Error: Cannot select same network device for both WAN and LAN"
    exit $EXIT_CODE_SAME_DEVICE_FOR_WAN_AND_LAN
  fi

[private]
assert-server-number-valid server-number:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ! "{{server-number}}" =~ ^[0-9]+$ ]] || [[ "{{server-number}}" -lt {{MIN_SERVER_NUMBER}} ]] || [[ "{{server-number}}" -gt {{MAX_SERVER_NUMBER}} ]]; then
    echo "Error: Server number must be a number between {{MIN_SERVER_NUMBER}} and {{MAX_SERVER_NUMBER}}"
    exit $EXIT_CODE_INVALID_SERVER_NUMBER
  fi

[private]
assert-server-name-valid server-name:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ! "{{server-name}}" =~ ^[a-z0-9]+$ ]]; then
    echo "Error: Server name may only contain lowercase letters a-z and digits 0-9"
    exit $EXIT_CODE_INVALID_SERVER_NAME
  fi

[private]
get-server-friendly-name domain-file error-code:
    #!/usr/bin/env bash
    set -euo pipefail

    DOMAIN_NAME=$(just util read-file "{{domain-file}}" "canonical server hostname" $EXIT_CODE_CANNOT_START_DAEMON)
    echo $DOMAIN_NAME | cut -d '.' -f1
