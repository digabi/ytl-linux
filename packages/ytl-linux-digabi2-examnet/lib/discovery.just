mod log
mod util
mod fs

EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY := env('EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY')

discovery net-device-wan net-device-lan server-number: \
  (util::assert-envs-set EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY
    "EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY"
    "PATH_DNSMASQ_STATIC_DNS_CONF"
    "PATH_SERVER_OWN_IP"
    "PATH_DNSMASQ_KTP_ALIASES_CONF"
    "DISCOVERY_PORT"
    "PATH_DISCOVERY_DB"
    "BIN_DIGABI2_EXAMNET_DISCOVERY"
  ) \
  (fs::assert-file-exists env("PATH_DNSMASQ_STATIC_DNS_CONF") EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY) \
  (fs::assert-file-exists env("PATH_SERVER_OWN_IP") EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY)
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Starting discovery process for server number {{server-number}}"

  CONFIG=$(cat <<EOF
      {
          "config": {
              "isProd": true,
              "ktpDomains": $(jq -Rcs '[. | split("\n") | .[] | match("host-record=(.+),.+").captures[0].string]' "$PATH_DNSMASQ_STATIC_DNS_CONF"),
              "dnsmasqConfigOutputFile": "$PATH_DNSMASQ_KTP_ALIASES_CONF",
              "ports": {"discovery": $DISCOVERY_PORT},
              "dbPath": "$PATH_DISCOVERY_DB"
          }
      }
  EOF
  )

  just log info "Running discovery for server number {{server-number}}"
  set +e
  if ! $BIN_DIGABI2_EXAMNET_DISCOVERY "$CONFIG"; then
      just log error "Discovery process exited with non-zero exit code"
      exit $EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY
  fi
  set -e
  just log info "Discovery process has exited"
