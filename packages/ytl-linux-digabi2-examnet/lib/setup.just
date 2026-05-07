mod log
mod util
mod network
mod fs
mod internet-forwarding
mod systemd
mod static-dns-records

EXIT_CODE_CANNOT_CONFIGURE_EXAMNET := env('EXIT_CODE_CANNOT_CONFIGURE_EXAMNET')
EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

apply net-device-wan net-device-lan server-number server-friendly-name: \
  (util::assert-envs-set EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
    "EXIT_CODE_NO_IP_ON_NETWORK_DEVICE"
    "EXIT_CODE_NETWORK_NOT_ONLINE"
    "EXIT_CODE_NO_SUCH_NETWORK_DEVICE"
    "EXIT_CODE_SAME_DEVICE_FOR_WAN_AND_LAN"
    "EXIT_CODE_INVALID_SERVER_NUMBER"
    "EXIT_CODE_INVALID_FRIENDLY_NAME"
    "PATH_EXAMNET_CONFIG"
    "PATH_NET_DEVICE_LAN_CONF"
    "PATH_NET_DEVICE_WAN_CONF"
    "PATH_SERVER_OWN_IP"
    "PATH_SERVER_FRIENDLY_NAME_CONF"
    "PATH_NETPLAN_CONF"
    "PATH_RESOLVED_CONF"
    "PATH_RESOLVED_CONF_TEMPLATE"
    "PATH_DNSMASQ_CONF"
    "PATH_DNSMASQ_CONF_TEMPLATE"
    "PATH_DOCKER_DAEMON_CONF"
    "PATH_DOCKER_DAEMON_CONF_TEMPLATE"
    "MIN_SERVER_NUMBER"
    "MAX_SERVER_NUMBER"
    "SUBNETS_PER_SERVER"
    "ALLOWED_DOCKER_IP_RANGES"
  ) \
  (assert-server-number-valid server-number) \
  (network::assert-device-exists net-device-wan) \
  (network::assert-device-exists net-device-lan) \
  (assert-server-friendly-name-valid server-friendly-name) \
  (assert-devices-different net-device-wan net-device-lan)
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Configuring examnet with WAN device '{{net-device-wan}}', LAN device '{{net-device-lan}}', server number {{server-number}} and server friendly name '{{server-friendly-name}}'"

  IP_WAN=$(just network get-device-ipv4-address "{{net-device-wan}}" $EXIT_CODE_NO_IP_ON_NETWORK_DEVICE)
  just log debug "WAN device {{net-device-wan}} has IP address '$IP_WAN'"

  IP_LAN_PREFIX=$(just network get-lan-ip-prefix "$IP_WAN")
  just log debug "Calculated LAN IP prefix '$IP_LAN_PREFIX'"

  IP_LAN=$(just network get-device-ipv4-address "{{net-device-lan}}")
  if [ -n "$IP_LAN" ]; then
    just log info "LAN device {{net-device-lan}} already has IP address '$IP_LAN'"
  else
    just log debug "LAN device {{net-device-lan}} does not have an IP address yet"
  fi

  export IP_WAN
  export IP_LAN_PREFIX

  SERVER_HOST_NUMBER=$(({{server-number}} * $SUBNETS_PER_SERVER))
  SERVER_OWN_IP="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.1"
  export SERVER_OWN_IP

  DHCP_RANGE_START="$IP_LAN_PREFIX$SERVER_HOST_NUMBER.10"
  DHCP_RANGE_END="$IP_LAN_PREFIX$((SERVER_HOST_NUMBER + $SUBNETS_PER_SERVER - 1)).254"
  export DHCP_RANGE_START
  export DHCP_RANGE_END

  NCSI_HOSTNAMES_LIST=$(cat $PATH_EXAMNET_CONFIG/ncsi-hostnames)
  export NCSI_HOSTNAMES_LIST

  just network configure-networkmanager "yo-{{net-device-lan}}" "{{net-device-lan}}" "$SERVER_OWN_IP/16"

  just log debug "Checking if netplan configuration file '$PATH_NETPLAN_CONF' exists and removing it if it does, to avoid conflicts with NetworkManager"
  if [[ -f "$PATH_NETPLAN_CONF" ]]; then
    just fs remove-file "$PATH_NETPLAN_CONF"
  fi

  just systemd restart NetworkManager
  just network wait-for-network-online

  just fs create-file-from-template "$PATH_RESOLVED_CONF" "$PATH_RESOLVED_CONF_TEMPLATE" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  export NET_DEVICE_LAN="{{net-device-lan}}"
  export ALLOWLISTED_SERVER_CONFIGURATION="$(just internet-forwarding get-allowlisted-server-configuration $INTERNET_ALLOWLISTED_DOMAINS)"
  export ALLOWLISTED_IPSET_CONFIGURATION="$(just internet-forwarding get-allowlisted-ipset-configuration $INTERNET_ALLOWLIST_IPSET_NAME $INTERNET_ALLOWLISTED_DOMAINS)"
  just fs empty-directory "$PATH_DNSMASQ"
  just fs create-file-from-template "$PATH_DNSMASQ_CONF" "$PATH_DNSMASQ_CONF_TEMPLATE" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just static-dns-records configure {{server-number}} $SUBNETS_PER_SERVER

  just internet-forwarding enable {{net-device-wan}} {{net-device-lan}} $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  DOCKER_NETWORK_PREFIX=$(just network get-available-ip-range-for-docker $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET "$SERVER_OWN_IP" "$IP_WAN")
  just log debug "Calculated Docker network prefix is '$DOCKER_NETWORK_PREFIX'"
  DOCKER_NETWORK_DNS_RESOLVER_IP="$DOCKER_NETWORK_PREFIX"0.1
  DOCKER_NETWORK_POOL_BASE_IP="$DOCKER_NETWORK_PREFIX"0.0

  export DOCKER_NETWORK_DNS_RESOLVER_IP
  export DOCKER_NETWORK_POOL_BASE_IP

  just fs create-file-from-template "$PATH_DOCKER_DAEMON_CONF" "$PATH_DOCKER_DAEMON_CONF_TEMPLATE" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
  just systemd restart docker

  # Enable relevant systemd services
  just systemd enable ytl-linux-digabi2-examnet
  just systemd enable dnsmasq
  just systemd enable ytl-linux-digabi2-examnet-discovery.service
  just systemd enable ytl-linux-digabi2-examnet-discovery.timer

  # (Re)start services
  just systemd restart systemd-resolved
  just systemd restart dnsmasq
  just systemd restart ytl-linux-digabi2-examnet
  just systemd restart ytl-linux-digabi2-examnet-discovery.timer
  just systemd restart ytl-linux-digabi2-examnet-discovery.service

  just setup write-examnet-config "{{net-device-wan}}" "{{net-device-lan}}" "$SERVER_OWN_IP" "{{server-friendly-name}}"

  just internet-forwarding populate-ipset $SERVER_OWN_IP $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just log info "Examnet configuration applied successfully"


destroy: \
  (util::assert-envs-set EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
    "EXIT_CODE_CANNOT_REMOVE_CONNECTION"
    "EXIT_CODE_NETWORK_NOT_ONLINE"
    "EXIT_CODE_CANNOT_REMOVE_FILES"
    "EXIT_CODE_CANNOT_CONFIGURE_EXAMNET"
    "PATH_RESOLVED_CONF"
    "PATH_DOCKER_DAEMON_CONF"
    "PATH_NET_DEVICE_WAN_CONF"
    "PATH_NET_DEVICE_LAN_CONF"
    "PATH_SERVER_FRIENDLY_NAME_CONF"
    "PATH_SERVER_OWN_IP"
    "PATH_DISCOVERY_DB"
    "PATH_DNSMASQ_CONF"
    "PATH_DNSMASQ_STATIC_DNS_CONF"
    "PATH_ETC_HOSTS"
    )
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Removing all examnet settings"

  just systemd disable ytl-linux-digabi2-examnet
  just systemd disable dnsmasq
  just systemd disable ytl-linux-digabi2-examnet-discovery.timer
  just systemd disable ytl-linux-digabi2-examnet-discovery.service

  just fs remove-file "$PATH_RESOLVED_CONF"
  just fs remove-file "$PATH_DOCKER_DAEMON_CONF"

  just fs remove-file "$PATH_EXAMNET_CONFIG/server-friendly-name"
  just fs remove-file "$PATH_EXAMNET_CONFIG/server-own-ip"
  just fs remove-file "$PATH_EXAMNET_CONFIG/net-device-lan"
  just fs remove-file "$PATH_EXAMNET_CONFIG/net-device-wan"
  just fs remove-file "$PATH_EXAMNET_CONFIG/discovery.db"

  just fs empty-directory "$PATH_DNSMASQ"

  just etc-hosts remove-school-domain-entries "$PATH_ETC_HOSTS" $EXIT_CODE_CANNOT_REMOVE_FILES

  just internet-forwarding disable $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just log debug "Getting list of network connections"
  CONNECTIONS=$(just network get-connections $EXIT_CODE_CANNOT_REMOVE_CONNECTION)

  printf '%s\n' "$CONNECTIONS" | grep -E -v "^UUID" | tr -s ' ' | while read -r line ; do
    connection_uuid=$(echo "$line" | cut -d ' ' -f 1)
    connection_name=$(echo "$line" | cut -d ' ' -f 2)
    if [[ "$connection_name" =~ ^yo- ]]; then
      just network delete-connection "$connection_name" "$connection_uuid" $EXIT_CODE_CANNOT_REMOVE_CONNECTION
    fi
  done

  just systemd restart systemd-resolved
  just systemd restart NetworkManager
  just systemd restart docker

  # Using a shorter timeout for removing settings, since if the internal network device does not have DHCP (common in dedicated exam networks,
  # since this server is acting as DHCP), the internal network connection will never activate. nm-online -s waits for connections to become
  # active within the timeout, so if the internal network device does not have DHCP, this will never happen and we will always hit the timeout.
  # As such, use a fairly short timeout to just give NetworkManager a little time to get the working connections up and going. Also ignoring
  # errors because it will always fail in the aforementioned instance.
  set +e
  just network wait-for-network-online 5
  set -e

  just log info "All examnet settings have been removed"

[private]
write-examnet-config net-device-wan net-device-lan server-own-ip server-friendly-name:
  just fs write-file "$PATH_NET_DEVICE_LAN_CONF" "{{net-device-lan}}"
  just fs write-file "$PATH_NET_DEVICE_WAN_CONF" "{{net-device-wan}}"
  just fs write-file "$PATH_SERVER_OWN_IP" "{{server-own-ip}}"
  just fs write-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "{{server-friendly-name}}"

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

  just log debug "Checking that server number '{{server-number}}' is a number between $MIN_SERVER_NUMBER and $MAX_SERVER_NUMBER"

  if [[ ! "{{server-number}}" =~ ^[0-9]+$ ]] || [[ "{{server-number}}" -lt $MIN_SERVER_NUMBER ]] || [[ "{{server-number}}" -gt $MAX_SERVER_NUMBER ]]; then
    just log error "Server number must be a number between $MIN_SERVER_NUMBER and $MAX_SERVER_NUMBER"
    exit $EXIT_CODE_INVALID_SERVER_NUMBER
  fi

[private]
assert-server-friendly-name-valid server-friendly-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking that server friendly name '{{server-friendly-name}}' only contains lowercase letters a-z and digits 0-9"

  if [[ ! "{{server-friendly-name}}" =~ ^[a-z0-9]+$ ]]; then
    just log error "Server friendly name may only contain lowercase letters a-z and digits 0-9"
    exit $EXIT_CODE_INVALID_FRIENDLY_NAME
  fi
