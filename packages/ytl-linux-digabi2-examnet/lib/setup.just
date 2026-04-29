mod log
mod util
mod network
mod fs
mod systemd
mod static-dns-records

MIN_SERVER_NUMBER := "1"
MAX_SERVER_NUMBER := "24"
SUBNETS_PER_SERVER := "10"

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

  just log info "Configuring examnet with WAN device '{{net-device-wan}}', LAN device '{{net-device-lan}}', server number {{server-number}} and server name '{{server-name}}'"

  IP_LAN=$(just network get-device-ipv4-address "{{net-device-lan}}")
  if [ -n "$IP_LAN" ]; then
    just log info "LAN device {{net-device-lan}} already has IP address '$IP_LAN'"
  else
    just log debug "LAN device {{net-device-lan}} does not have an IP address yet"
  fi
  IP_WAN=$(just network get-device-ipv4-address "{{net-device-wan}}" $EXIT_CODE_WAN_WITH_NO_IP)
  just log debug "WAN device {{net-device-wan}} has IP address '$IP_WAN'"
  IP_LAN_PREFIX=$(just network get-lan-ip-prefix "$IP_WAN")
  just log debug "Calculated LAN IP prefix '$IP_LAN_PREFIX'"

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

  if [[ -f "$PATH_NETPLAN_CONF" ]]; then
    rm -f "$PATH_NETPLAN_CONF"
  fi

  just systemd restart NetworkManager
  just network wait-for-network-online $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just fs write-file "$PATH_RESOLVED_CONF" "$(envsubst < $PATH_RESOLVED_CONF_TEMPLATE)"

  just fs empty-directory "$PATH_DNSMASQ"
  just fs write-file "$PATH_DNSMASQ_CONF" "$(envsubst < $PATH_DNSMASQ_CONF_TEMPLATE)"

  # FIXME: Onko tämä oikea kohta?
  just static-dns-records configure {{net-device-wan}} {{server-number}} {{SUBNETS_PER_SERVER}} $SERVER_OWN_IP $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  DOCKER_NETWORK_PREFIX=$(just network get-available-ip-range-for-docker "$SERVER_OWN_IP" "$IP_WAN")
  just log debug "Calculated Docker network prefix is '$DOCKER_NETWORK_PREFIX'"
  DOCKER_NETWORK_DNS_RESOLVER_IP="$DOCKER_NETWORK_PREFIX"0.1
  DOCKER_NETWORK_POOL_BASE_IP="$DOCKER_NETWORK_PREFIX"0.0

  export DOCKER_NETWORK_DNS_RESOLVER_IP
  export DOCKER_NETWORK_POOL_BASE_IP

  just fs write-file "$PATH_DOCKER_DAEMON_CONF" "$(envsubst < $PATH_DOCKER_DAEMON_CONF_TEMPLATE)"

  # Enable relevant systemd services
  just systemd enable ytl-linux-digabi2-examnet
  just systemd enable dnsmasq
  just systemd enable ytl-linux-digabi2-examnet-discovery.timer
  just systemd enable ytl-linux-digabi2-examnet-discovery.service

  # (Re)start services
  just systemd restart systemd-resolved
  just systemd restart dnsmasq
  just systemd restart ytl-linux-digabi2-examnet
  just systemd restart ytl-linux-digabi2-examnet-discovery.timer
  just systemd restart ytl-linux-digabi2-examnet-discovery.service

  just setup write-examnet-config "{{net-device-wan}}" "{{net-device-lan}}" "$SERVER_OWN_IP" "{{server-name}}"

  just log info "Examnet configuration applied successfully"

[private]
write-examnet-config net-device-wan net-device-lan server-own-ip server-name:
  just fs write-file "$PATH_NET_DEVICE_LAN_CONF" "{{net-device-lan}}"
  just fs write-file "$PATH_NET_DEVICE_WAN_CONF" "{{net-device-wan}}"
  just fs write-file "$PATH_SERVER_OWN_IP" "{{server-own-ip}}"
  just fs write-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "{{server-name}}"

[private]
assert-device-exists device:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if network device {{device}} exists"

  if ! ip link show "{{device}}" &> /dev/null; then
    just log error "Network device {{device}} does not exist"
    exit $EXIT_CODE_NO_SUCH_NETWORK_DEVICE
  fi

[private]
assert-devices-different wan-network-device lan-network-device:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking that WAN network device '{{wan-network-device}}' and LAN network device '{{lan-network-device}}' are different"

  if [[ "{{wan-network-device}}" == "{{lan-network-device}}" ]]; then
    just log error "Cannot select same network device for both WAN and LAN"
    exit $EXIT_CODE_SAME_DEVICE_FOR_WAN_AND_LAN
  fi

[private]
assert-server-number-valid server-number:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking that server number '{{server-number}}' is a number between {{MIN_SERVER_NUMBER}} and {{MAX_SERVER_NUMBER}}"

  if [[ ! "{{server-number}}" =~ ^[0-9]+$ ]] || [[ "{{server-number}}" -lt {{MIN_SERVER_NUMBER}} ]] || [[ "{{server-number}}" -gt {{MAX_SERVER_NUMBER}} ]]; then
    just log error "Server number must be a number between {{MIN_SERVER_NUMBER}} and {{MAX_SERVER_NUMBER}}"
    exit $EXIT_CODE_INVALID_SERVER_NUMBER
  fi

[private]
assert-server-name-valid server-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking that server name '{{server-name}}' only contains lowercase letters a-z and digits 0-9"

  if [[ ! "{{server-name}}" =~ ^[a-z0-9]+$ ]]; then
    just log error "Server name may only contain lowercase letters a-z and digits 0-9"
    exit $EXIT_CODE_INVALID_SERVER_NAME
  fi

[private]
get-server-friendly-name domain-file error-code:
    #!/usr/bin/env bash
    set -euo pipefail

    DOMAIN_NAME=$(just fs read-file "{{domain-file}}" "canonical server hostname" {{error-code}})
    echo $DOMAIN_NAME | cut -d '.' -f1
