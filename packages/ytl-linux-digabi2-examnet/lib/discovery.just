mod util 'util.just'

EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY := env('EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY')

discovery net-device-wan net-device-lan server-number: \
  (util::assert-envs-set EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY
    "EXIT_CODE_DAEMON_EXITED_UNEXPECTEDLY'"
    "PATH_DNSMASQ_STATIC_DNS_CONF"
    "PATH_SERVER_OWN_IP"
    "PATH_DNSMASQ_KTP_ALIASES_CONF"
    "DISCOVERY_PORT"
    "PATH_DISCOVERY_DB"
    "BIN_DIGABI2_EXAMNET_DISCOVERY"
    ) \
    (util::assert-file-exists env("PATH_DNSMASQ_STATIC_DNS_CONF") EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY) \
    (util::assert-file-exists env("PATH_SERVER_OWN_IP") EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY)
    #!/usr/bin/env bash
    set -euo pipefail

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

    echo "INFO: Running discovery for server number {{server-number}}"

    set +e
    if ! $BIN_DIGABI2_EXAMNET_DISCOVERY "$CONFIG"; then
        echo "ERROR: Discovery process exited with non-zero exit code"
        exit $EXIT_CODE_CANNOT_RUN_ALIAS_DISCOVERY
    fi
    set -e
    echo "INFO: Discovery process has exited"
