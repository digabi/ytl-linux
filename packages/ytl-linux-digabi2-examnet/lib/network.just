mod util
mod fs
mod log

get-device-ipv4-address device error-code-if-no-ip="":
  #!/usr/bin/env bash
  set -euo pipefail

  IP=$(ip -oneline -4 addr show scope global "{{device}}" | tr -s ' ' | tr '/' ' ' | cut -d ' ' -f4)

  if [[ -z "$IP" ]] && [[ -n "{{error-code-if-no-ip}}" ]]; then
    just log error "Network device {{device}} does not have an IPv4 address"
    exit {{error-code-if-no-ip}}
  fi
  echo "$IP"

get-lan-ip-prefix wan-ip:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ "{{wan-ip}}" =~ ^192\.168\. ]]; then
    echo "10.0.";
  else
    echo "192.168.";
  fi

get-available-ip-range-for-docker error-code +reserved-ips:
  #!/usr/bin/env bash
  set -euo pipefail

  IFS=' ' read -r -a RANGES <<< "$ALLOWED_DOCKER_IP_RANGES"

  for range in "${RANGES[@]}"; do
    _USED=false

    for reserved in {{reserved-ips}}; do
      if [[ ${reserved%%.*} == ${range%%.*} ]]; then
        _USED=true
        break
      fi
    done

    if [[ "$_USED" == false ]]; then
      # return the first available
      echo "$range"
      exit
    fi
  done

  just log error "Could not find an available IP range for Docker"
  exit {{error-code}}

configure-networkmanager connection-name interface-name ip-and-netmask:
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Configuring NetworkManager connection '{{connection-name}}' for interface '{{interface-name}}' with IP and netmask '{{ip-and-netmask}}'"

  just log debug "Checking if NetworkManager connection '{{connection-name}}' already exists"
  if nmcli connection show "{{connection-name}}" > /dev/null 2>&1; then
    just log debug "NetworkManager connection '{{connection-name}}' already exists, deleting it before creating a new one"
    if ! nmcli connection delete "{{connection-name}}"; then
      just log error "Failed to delete existing NetworkManager connection '{{connection-name}}'"
      exit $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
    fi
  fi

  just log debug "Adding NetworkManager connection '{{connection-name}}' for interface '{{interface-name}}' with IP and netmask '{{ip-and-netmask}}'"
  if ! nmcli connection add \
        type ethernet \
        ifname "{{interface-name}}" \
        con-name "{{connection-name}}" \
        ip4 "{{ip-and-netmask}}" \
        autoconnect yes \
        save yes; then
    just log error "Failed to add NetworkManager connection '{{connection-name}}' for interface '{{interface-name}}' with IP and netmask '{{ip-and-netmask}}'"
    exit $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
  fi

  just log debug "Disabling IPv6 for NetworkManager connection '{{connection-name}}'"
  nmcli connection modify "{{connection-name}}" ipv6.method disabled

  just log debug "Bringing up NetworkManager connection '{{connection-name}}'"
  nmcli connection up "{{connection-name}}"

  just log info "Successfully configured NetworkManager connection '{{connection-name}}' for interface '{{interface-name}}' with IP and netmask '{{ip-and-netmask}}'"

get-connections error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! CONNECTIONS=$(nmcli -f UUID,NAME connection show); then
      just log error "Failed to enumerate NetworkManager connections"
      exit {{error-code}}
  fi

  echo "$CONNECTIONS"

delete-connection connection-name connection-uuid error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Deleting NetworkManager connection '{{connection-name}}' with UUID {{connection-uuid}}"
  if ! nmcli connection delete "{{connection-uuid}}"; then
    just log error "Failed to delete NetworkManager connection '{{connection-name}}' with UUID {{connection-uuid}}"
    exit {{error-code}}
  fi

  just log info "Successfully deleted NetworkManager connection '{{connection-name}}' with UUID {{connection-uuid}}"

wait-for-network-online timeout="30":
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Waiting for network to be online (timeout: {{timeout}} seconds)..."
  if ! nm-online -s -q --timeout="{{timeout}}" 2>&1; then
    just log error "Network did not become online within timeout of {{timeout}} seconds"
    exit $EXIT_CODE_NETWORK_NOT_ONLINE
  fi

  just log debug "Network is online"

[private]
assert-device-exists device:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if network device {{device}} exists"

  if ! ip link show "{{device}}" > /dev/null; then
    just log error "Network device {{device}} does not exist"
    exit $EXIT_CODE_NO_SUCH_NETWORK_DEVICE
  fi

# Remove Abitti 2 networks before writing daemon.json so Docker can start.
# If Docker is down, move daemon.json aside and start it first.
prepare-docker-for-address-pool:
  #!/usr/bin/env bash
  set -euo pipefail

  DAEMON_JSON="$PATH_DOCKER_DAEMON_CONF"
  BACKUP="${DAEMON_JSON}.backup"
  MOVED=0

  systemd_docker() {
    if ! systemctl "$1" docker >/dev/null; then
      if [[ "$MOVED" == 1 && ! -f "$DAEMON_JSON" ]]; then
        mv "$BACKUP" "$DAEMON_JSON"
      fi
      just log error "Failed to $1 systemd unit 'docker'"
      exit $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
    fi
  }

  if ! docker ps >/dev/null 2>&1; then
    just log info "Docker is not running. Starting it with default network settings so Abitti 2 networks can be removed"
    if [[ -f "$DAEMON_JSON" ]]; then
      just log info "Moving $DAEMON_JSON aside so Docker can start"
      if ! mv "$DAEMON_JSON" "$BACKUP"; then
        just log error "Failed to move $DAEMON_JSON aside"
        exit $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
      fi
      MOVED=1
    fi
    systemd_docker reset-failed
    systemd_docker start
  fi

  for name in digabi2_ktpjs_internal_network digabi2_ktpjs_public_network; do
    if ! network_id=$(docker network ls --filter "name=^${name}$" --quiet); then
      just log error "Failed to check whether Docker network $name exists"
      exit $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
    fi
    if [[ -n "$network_id" ]]; then
      just log info "Removing Docker network $name"
      if ! docker network rm "$name"; then
        just log error "Failed to remove Docker network $name. Stop the server if it is still running, then save the network settings again"
        exit $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
      fi
    fi
  done

  systemd_docker stop
  just fs create-file-from-template "$DAEMON_JSON" "$PATH_DOCKER_DAEMON_CONF_TEMPLATE" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
  systemd_docker start
  just fs remove-file "$BACKUP"
