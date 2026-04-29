mod log
mod util
mod network
mod fs

EXIT_CODE_CANNOT_START_BOUNCER := env('EXIT_CODE_CANNOT_START_BOUNCER')

bouncer net-device-wan net-device-lan server-number: \
  (util::assert-envs-set EXIT_CODE_CANNOT_START_BOUNCER
    "EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY"
    "EXIT_CODE_NO_IP_ON_NETWORK_DEVICE"
    "PATH_NET_DEVICE_LAN_CONF"
    "PATH_SERVER_FRIENDLY_NAME_CONF"
    "PATH_NAKSU2_DOMAIN"
    "PATH_SERVER_OWN_IP"
    "PATH_EXAMNET_CONFIG"
    "PATH_NAKSU2_CERTS_DIR"
    "FRIENDLY_NAME_SEARCH_DOMAIN"
    "DISCOVERY_PORT"
    "BOUNCER_PORT"
    "BIN_DIGABI2_EXAMNET_BOUNCER"
    "PATH_NAKSU2_FULLCHAIN_PEM"
    "PATH_NAKSU2_KEY_PEM"
    "PATH_NCSI_HOSTNAMES"
  ) \
  (fs::assert-file-contents env("PATH_NET_DEVICE_LAN_CONF") net-device-lan EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_SERVER_OWN_IP") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_SERVER_FRIENDLY_NAME_CONF") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_DOMAIN") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NCSI_HOSTNAMES") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_FULLCHAIN_PEM") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_KEY_PEM") EXIT_CODE_CANNOT_START_BOUNCER)
  #!/usr/bin/env bash
  set -euo pipefail

  IP_LAN=$(just network get-device-ipv4-address "{{net-device-lan}}" $EXIT_CODE_NO_IP_ON_NETWORK_DEVICE)
  just log debug "Detected LAN IP address '$IP_LAN' for device {{net-device-lan}}"

  CONFIGURED_IP_LAN=$(just fs read-file "$PATH_SERVER_OWN_IP" "configured server LAN IP" $EXIT_CODE_CANNOT_START_BOUNCER)
  just log debug  "Configured LAN IP address for server is '$CONFIGURED_IP_LAN'"

  if [[ "$IP_LAN" != "$CONFIGURED_IP_LAN" ]]; then
    just log error "Detected LAN IP address '$IP_LAN' does not match configured LAN IP address '$CONFIGURED_IP_LAN'"
    exit $EXIT_CODE_CANNOT_START_BOUNCER
  fi

  CONFIGURED_SERVER_NAME=$(just fs read-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "configured server friendly name" $EXIT_CODE_CANNOT_START_BOUNCER)
  just log debug "Configured server friendly name is '$CONFIGURED_SERVER_NAME'"

  CANONICAL_HOSTNAME=$(just fs read-file "$PATH_NAKSU2_DOMAIN" "canonical server hostname" $EXIT_CODE_CANNOT_START_BOUNCER)
  just log debug "Canonical server hostname is '$CANONICAL_HOSTNAME'"

  if [[ -z "$CANONICAL_HOSTNAME" ]]; then
    just log error "Canonical server hostname cannot be empty"
    exit $EXIT_CODE_CANNOT_START_BOUNCER
  fi

  NCSI_HOSTNAMES=$(jq -Rc '.|split(",")|map(select(.!=""))' "$PATH_NCSI_HOSTNAMES")
  just log debug "NCSI hostnames are '$NCSI_HOSTNAMES'"

  CONFIG=$(cat <<EOF
      {\
          "config": {\
              "friendlyName": "$CONFIGURED_SERVER_NAME", \
              "canonicalHostname": "$CANONICAL_HOSTNAME", \
              "ncsiHostnames": ${NCSI_HOSTNAMES}, \
              "searchDomain": "$FRIENDLY_NAME_SEARCH_DOMAIN", \
              "serverOwnIp": "$IP_LAN", \
              "ports": {"discovery": $DISCOVERY_PORT, "bouncer": $BOUNCER_PORT} \
          }, \
          "secrets": {"cert":"$PATH_NAKSU2_FULLCHAIN_PEM","key":"$PATH_NAKSU2_KEY_PEM"} \
      }
  EOF
  )

  just log info "Starting bouncer with LAN device {{net-device-lan}}, server number {{server-number}}, detected LAN IP $IP_LAN"

  set +e
  if ! $BIN_DIGABI2_EXAMNET_BOUNCER "$CONFIG"; then
    just log error "Bouncer process exited with non-zero exit code"
  fi
  set -e
  just log info "Bouncer process has exited"

  exit $EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY
