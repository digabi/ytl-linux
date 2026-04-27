mod log 'log.just'
mod util 'util.just'

EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

destroy net-device-wan net-device-lan server-number: \
  (util::assert-envs-set EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
    "EXIT_CODE_CANNOT_REMOVE_CONNECTION"
    "EXIT_CODE_NETWORK_NOT_ONLINE"
    "EXIT_CODE_CANNOT_RESTART_RESOLVED"
    "EXIT_CODE_CANNOT_RESTART_DNSMASQ"
    "EXIT_CODE_CANNOT_RESTART_NM"
    "EXIT_CODE_CANNOT_RESTART_DOCKER"
    "EXIT_CODE_CANNOT_REMOVE_FILES"
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

  just util disable-systemd-unit ytl-linux-digabi2-examnet.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just util disable-systemd-unit dnsmasq.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just util disable-systemd-unit ytl-linux-digabi2-examnet-discovery.timer $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util disable-systemd-unit ytl-linux-digabi2-examnet-discovery.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just util remove-file "$PATH_RESOLVED_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"
  just util remove-file "$PATH_DOCKER_DAEMON_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"

  just util remove-file "$PATH_NET_DEVICE_WAN_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"
  just util remove-file "$PATH_NET_DEVICE_LAN_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"
  just util remove-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"
  just util remove-file "$PATH_SERVER_OWN_IP" "$EXIT_CODE_CANNOT_REMOVE_FILES"

  just util remove-file "$PATH_DISCOVERY_DB" "$EXIT_CODE_CANNOT_REMOVE_FILES"

  just util remove-file "$PATH_DNSMASQ_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"
  just util remove-file "$PATH_DNSMASQ_STATIC_DNS_CONF" "$EXIT_CODE_CANNOT_REMOVE_FILES"

  just log debug "Removing school domain entries from $PATH_ETC_HOSTS"
  sed -i '' '/^# BEGIN SCHOOL DOMAIN ENTRIES$/,/^# END SCHOOL DOMAIN ENTRIES$/d' "$PATH_ETC_HOSTS"

  just log debug "Getting list of network connections"
  CONNECTIONS=$(just network get-connections $EXIT_CODE_CANNOT_REMOVE_CONNECTION)

  printf '%S\n' "$CONNECTIONS" | grep -E -v "^UUID" | tr -s ' ' | while read -r line ; do
    connection_uuid=$(echo "$line" | cut -d ' ' -f 1)
    connection_name=$(echo "$line" | cut -d ' ' -f 2)
    if [[ "$connection_name" =~ ^yo- ]]; then
      just network delete-connection "$connection_name" "$connection_uuid" $EXIT_CODE_CANNOT_REMOVE_CONNECTION
    fi
  done

  just util restart-systemd-unit systemd-resolved $EXIT_CODE_CANNOT_RESTART_RESOLVED

  just util restart-systemd-unit-if-enabled dnsmasq.service $EXIT_CODE_CANNOT_RESTART_DNSMASQ

  just util restart-systemd-unit NetworkManager.service $EXIT_CODE_CANNOT_RESTART_NM

  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet-discovery.timer $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet-discovery.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just util restart-systemd-unit docker $EXIT_CODE_CANNOT_RESTART_DOCKER

  just network wait-for-network-online $EXIT_CODE_NETWORK_NOT_ONLINE 5

  just log info "All examnet settings have been removed"
