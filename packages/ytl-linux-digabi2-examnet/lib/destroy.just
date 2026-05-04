mod log
mod fs
mod internet-forwarding
mod systemd
mod util

EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

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

  just network wait-for-network-online 5

  just log info "All examnet settings have been removed"
