mod log
mod util
mod network
mod fs

EXIT_CODE_CANNOT_START_BOUNCER := env('EXIT_CODE_CANNOT_START_BOUNCER')

start: \
  (util::assert-envs-set EXIT_CODE_CANNOT_START_BOUNCER
    "EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY"
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
  (fs::assert-file-exists env("PATH_SERVER_OWN_IP") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_SERVER_FRIENDLY_NAME_CONF") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_DOMAIN") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NCSI_HOSTNAMES") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_FULLCHAIN_PEM") EXIT_CODE_CANNOT_START_BOUNCER) \
  (fs::assert-file-exists env("PATH_NAKSU2_KEY_PEM") EXIT_CODE_CANNOT_START_BOUNCER)
  #!/usr/bin/env bash
  set -euo pipefail

  SERVER_OWN_IP=$(just fs read-file "$PATH_SERVER_OWN_IP" "configured server LAN IP" $EXIT_CODE_CANNOT_START_BOUNCER)
  SERVER_FRIENDLY_NAME=$(just fs read-file "$PATH_SERVER_FRIENDLY_NAME_CONF" "configured server friendly name" $EXIT_CODE_CANNOT_START_BOUNCER)
  CANONICAL_HOSTNAME=$(just fs read-file "$PATH_NAKSU2_DOMAIN" "canonical server hostname" $EXIT_CODE_CANNOT_START_BOUNCER)

  if [[ -z "$CANONICAL_HOSTNAME" ]]; then
    just log error "Canonical server hostname cannot be empty"
    exit $EXIT_CODE_CANNOT_START_BOUNCER
  fi

  NCSI_HOSTNAMES=$(jq -Rc '.|split(",")|map(select(.!=""))' "$PATH_NCSI_HOSTNAMES")

  CONFIG=$(cat <<EOF
      {\
          "config": {\
              "friendlyName": "$SERVER_FRIENDLY_NAME", \
              "canonicalHostname": "$CANONICAL_HOSTNAME", \
              "ncsiHostnames": ${NCSI_HOSTNAMES}, \
              "searchDomain": "$FRIENDLY_NAME_SEARCH_DOMAIN", \
              "serverOwnIp": "$SERVER_OWN_IP", \
              "ports": {"discovery": $DISCOVERY_PORT, "bouncer": $BOUNCER_PORT} \
          }, \
          "secrets": {"cert":"$PATH_NAKSU2_FULLCHAIN_PEM","key":"$PATH_NAKSU2_KEY_PEM"} \
      }
  EOF
  )

  set +e
  if ! $BIN_DIGABI2_EXAMNET_BOUNCER "$CONFIG"; then
    just log error "Bouncer process exited with non-zero exit code"
  fi
  set -e
  just log info "Bouncer process has exited"

  exit $EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY

restart:
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Restarting bouncer and discovery services"

  just systemd restart-if-enabled ytl-linux-digabi2-examnet
  just systemd restart-if-enabled ytl-linux-digabi2-examnet-discovery.timer
  just systemd restart-if-enabled ytl-linux-digabi2-examnet-discovery.service

  just log info "Successfully restarted bouncer and discovery services"
