mod etc-hosts
mod fs
mod log
mod util

EXIT_CODE_CANNOT_CONFIGURE_EXAMNET:=env('EXIT_CODE_CANNOT_CONFIGURE_EXAMNET')

configure server-number subnets-per-server: \
  (util::assert-envs-set EXIT_CODE_CANNOT_CONFIGURE_EXAMNET
    "EXIT_CODE_MISSING_CERTIFICATE"
    "EXIT_CODE_NO_SAN_FOR_SERVER_NUMBER"
    "PATH_NAKSU2_CERT"
    "PATH_ETC_HOSTS"
    "PATH_NAKSU2_DOMAIN"
    "PATH_NAKSU2_WORKDIR"
    "PATH_DNSMASQ_STATIC_DNS_CONF"
  ) \
  (util::assert-program-exists "openssl")
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Configuring static DNS records for server number {{server-number}}"

  if [ ! -f "$PATH_NAKSU2_CERT" ]; then
      just log error "Certificate file not found at $PATH_NAKSU2_CERT"
      exit $EXIT_CODE_MISSING_CERTIFICATE
  fi

  # Parse out SANs from certificate; only include server subdomains (e.g. ktp1.1000.koe.abitti.net), not the "root subdomain"
  # (e.g. 1000.koe.abitti.net) since we cannot reasonably ascribe DNS names to these
  DOMAINS="$(
    openssl x509 -in "$PATH_NAKSU2_CERT" -text -noout |\
    grep 'DNS:' |\
    sed 's/DNS://g' |\
    tr ',' '\n' |\
    grep -E '[^.]+\.[^.]+\.koe\.abitti\.net' || echo ""
  )"

  just log debug "Extracted domains from certificate: '$DOMAINS'"

  DNS_RECORDS=()
  ETC_HOSTS=()
  THIS_SERVER_DOMAIN=""

  for DOMAIN in $DOMAINS; do
    just log debug "Generating DNS record for domain: $DOMAIN"

    SERVER_NUMBER="$(echo "$DOMAIN" | cut -d '.' -f1 | tr -dc '[:digit:]')"
    just log debug "Server number of domain $DOMAIN is: $SERVER_NUMBER"

    if [ "$SERVER_NUMBER" == "{{server-number}}" ]; then
        just log debug "Found this server's domain based on server number {{server-number}}: $DOMAIN"
        THIS_SERVER_DOMAIN=$DOMAIN
    fi

    IP="${IP_LAN_PREFIX}$((SERVER_NUMBER * {{subnets-per-server}})).1"

    just log debug "Adding DNS record for domain $DOMAIN with IP $IP"
    DNS_RECORDS+=("host-record=$DOMAIN,$IP")

    just log debug "Adding /etc/hosts entry for domain $DOMAIN with IP $IP"
    ETC_HOSTS+=("$IP $DOMAIN")
  done

  if [ -z "$THIS_SERVER_DOMAIN" ]; then
    just log error "Certificate did not contain a valid domain for server number {{server-number}}"
    exit $EXIT_CODE_NO_SAN_FOR_SERVER_NUMBER
  fi

  just log debug "Generated DNS records: ${DNS_RECORDS[*]}"
  just log debug "Generated /etc/hosts entries: ${ETC_HOSTS[*]}"

  just fs write-file "$PATH_DNSMASQ_STATIC_DNS_CONF" "$(IFS=$'\n'; echo "${DNS_RECORDS[*]}")"

  just etc-hosts remove-school-domain-entries "$PATH_ETC_HOSTS" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just log debug "Adding school domain entries to /etc/hosts for server number {{server-number}}"

  SCHOOL_DOMAIN_ENTRIES=$(printf '%s\n' "${ETC_HOSTS[@]}")
  just etc-hosts add-school-domain-entries "$PATH_ETC_HOSTS" "$SCHOOL_DOMAIN_ENTRIES" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET

  just log debug "Got back from add-school-domain-entries"

  just log debug "Getting owner of Naksu2 workdir at $PATH_NAKSU2_WORKDIR to set correct ownership for created domain file at $PATH_NAKSU2_DOMAIN"
  NAKSU2_WORKDIR_OWNER=$(just fs get-dir-owner "$PATH_NAKSU2_WORKDIR" $EXIT_CODE_CANNOT_CONFIGURE_EXAMNET)

  just log debug "Configuring domain for KTP"
  just log debug "This server's domain based on server number {{server-number}} is: $THIS_SERVER_DOMAIN"
  just fs write-file "$PATH_NAKSU2_DOMAIN" "$THIS_SERVER_DOMAIN" "$NAKSU2_WORKDIR_OWNER"

  just log debug "Successfully configured static DNS records for server number {{server-number}}"
