MIN_SERVER_NUMBER := 1
MAX_SERVER_NUMBER := 24
SUBNETS_PER_SERVER := 10

mod network 'network.just'

apply net-device-wan net-device-lan server-number server-name: \
  assert-user-is-root \
  (assert-server-number-valid server-number)
  (assert-server-name-valid server-name)
  (assert-device-exists net-device-wan) \
  (assert-device-exists net-device-lan) \
  (assert-devices-different net-device-wan net-device-lan) \
  #!/usr/bin/env bash
  set -euo pipefail

  IP_LAN=$(just network get-device-ipv4-address "{{net-device-lan}}")
  IP_WAN=$(just network get-device-ipv4-address "{{net-device-wan}}")
  IP_LAN_PREFIX=$(just network get-lan-ip-prefix "$IP_WAN")

  SERVER_HOST_NUMBER=$((SERVER_NUMBER * {{SUBNETS_PER_SERVER}}))
  SERVER_OWN_IP="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.1"

  DHCP_RANGE_START="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.10"
  DHCP_RANGE_END="$IP_LAN_PREFIX$((SERVER_HOST_NUMBER + {{SUBNETS_PER_SERVER}} - 1)).254"

  just network configure-networkmanager "yo-{{net-device-lan}}" "{{net-device-lan}}" "$SERVER_OWN_IP/16"

[private]
assert-user-is-root:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ $TEST_MODE != "test" && $EUID -ne 0 ]]; then
    echo "Error: This script must be run as root"
  fi

  exit $EXIT_CODE_MUST_BE_ROOT

[private]
assert-device-exists device:
  #!/usr/bin/env bash
  set -euo pipefail
  
  if [[ ! -d "/sys/class/net/{{device}}" ]]; then
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
