mod fs
mod iptables
mod log
mod network
mod util

enable net-device-wan net-device-lan error-code: \
  (util::assert-envs-set error-code
    "INTERNET_ALLOWLIST_DOMAINS"
    "PATH_DNSMASQ_IPSET_ALLOWLIST_CONF"
    "PATH_DNSMASQ_SERVER_ALLOWLIST_CONF"
    "INTERNET_ALLOWLIST_IPSET_NAME"
    "INTERNET_ALLOWLIST_FILTER_CHAIN"
    "INTERNET_ALLOWLIST_IPSET_TIMEOUT_SECONDS"
  ) \
  (util::assert-program-exists "iptables") \
  (util::assert-program-exists "ipset") \
  (util::assert-program-exists "dig") \
  (network::assert-device-exists net-device-wan) \
  (network::assert-device-exists net-device-lan)
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Enabling internet forwarding for domains: $INTERNET_ALLOWLIST_DOMAINS"

  # Allowlisted domains are forwarded to upstream resolvers
  # All other domains are null-routed by address=/#/0.0.0.0 in the main configuration
  for domain in $INTERNET_ALLOWLIST_DOMAINS; do
    domain_suffix="$(just internet-forwarding normalize-dnsmasq-domain-suffix "$domain")"
    echo "ipset=/$domain_suffix/$INTERNET_ALLOWLIST_IPSET_NAME"
  done > "$PATH_DNSMASQ_IPSET_ALLOWLIST_CONF"

  # Forward only allowlisted domains to upstream DNS (as defined by resolv-file=/etc/resolv.conf)
  for domain in $INTERNET_ALLOWLIST_DOMAINS; do
    domain_suffix="$(just internet-forwarding normalize-dnsmasq-domain-suffix "$domain")"
    echo "server=/$domain_suffix/#"
  done > "$PATH_DNSMASQ_SERVER_ALLOWLIST_CONF"

  # Ensure ipset exists
  just log debug "Ensuring ipset '$INTERNET_ALLOWLIST_IPSET_NAME' exists"
  if ! ipset create "$INTERNET_ALLOWLIST_IPSET_NAME" hash:ip timeout "$INTERNET_ALLOWLIST_IPSET_TIMEOUT_SECONDS" -exist; then
    just log error "Failed to create ipset '$INTERNET_ALLOWLIST_IPSET_NAME'"
    exit {{error-code}}
  fi

  # Remove possible existing iptables rules and recreate allowlist filter chain to ensure idempotency
  just internet-forwarding remove-iptables-rules-by-comment "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}
  just iptables recreate-chain filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}}

  # Log new allowlisted flows
  just iptables add-rule filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}} \
      --match conntrack --ctstate NEW \
      --match set --match-set "$INTERNET_ALLOWLIST_IPSET_NAME" dst \
      --match limit --limit 10/second --limit-burst 30 \
      --jump LOG --log-prefix "YTL_ALLOW_NEW " --log-level 6

  # Allow only ipset allowlisted destinations
  just iptables add-rule filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}} \
      --match set --match-set "$INTERNET_ALLOWLIST_IPSET_NAME" dst \
      --jump ACCEPT

  # Drop all other LAN->WAN traffic
  just iptables add-rule filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}} \
      --jump DROP

  # Allow return traffic
  just iptables add-rule filter FORWARD {{error-code}} \
      --in-interface "{{net-device-wan}}" --out-interface "{{net-device-lan}}" \
      --match comment --comment "$INTERNET_ALLOWLIST_IPSET_NAME" \
      --match conntrack --ctstate RELATED,ESTABLISHED \
      --jump ACCEPT

  # Enforce allowlist for LAN->WAN traffic
  just iptables add-rule filter FORWARD {{error-code}} \
      --in-interface "{{net-device-lan}}" --out-interface "{{net-device-wan}}" \
      --match comment --comment "$INTERNET_ALLOWLIST_IPSET_NAME" \
      --jump "$INTERNET_ALLOWLIST_FILTER_CHAIN"

  # NAT only for ipset allowlisted destinations
  just iptables add-rule nat POSTROUTING {{error-code}} \
      --out-interface "{{net-device-wan}}" \
      --match comment --comment "$INTERNET_ALLOWLIST_IPSET_NAME" \
      --match set --match-set "$INTERNET_ALLOWLIST_IPSET_NAME" dst \
      --jump MASQUERADE

  just log info "Done enabling internet forwarding"

disable error-code: (util::assert-envs-set error-code "PATH_DNSMASQ_IPSET_ALLOWLIST_CONF" "PATH_DNSMASQ_SERVER_ALLOWLIST_CONF" "INTERNET_ALLOWLIST_IPSET_NAME" "INTERNET_ALLOWLIST_FILTER_CHAIN") (util::assert-program-exists "iptables") (util::assert-program-exists "ipset")
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Disabling internet forwarding"

  just internet-forwarding remove-iptables-rules-by-comment "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}

  just iptables flush-and-delete-chain filter "$INTERNET_ALLOWLIST_FILTER_CHAIN" {{error-code}}

  if ipset list "$INTERNET_ALLOWLIST_IPSET_NAME" > /dev/null 2>&1; then
    just log debug "Flushing and destroying ipset '$INTERNET_ALLOWLIST_IPSET_NAME'"
    ipset flush "$INTERNET_ALLOWLIST_IPSET_NAME"
    ipset destroy "$INTERNET_ALLOWLIST_IPSET_NAME"
  else
    just log debug "ipset '$INTERNET_ALLOWLIST_IPSET_NAME' does not exist"
  fi

  just fs remove-file "$PATH_DNSMASQ_IPSET_ALLOWLIST_CONF"
  just fs remove-file "$PATH_DNSMASQ_SERVER_ALLOWLIST_CONF"

  just log info "Done disabling internet forwarding"

remove-iptables-rules-by-comment comment error-code:
  #!/usr/bin/env bash
  set -euo pipefail

      just iptables remove-rules-by-comment nat POSTROUTING {{comment}} {{error-code}}
  just iptables remove-rules-by-comment filter FORWARD {{comment}} {{error-code}}

normalize-dnsmasq-domain-suffix domain:
  #!/usr/bin/env bash
  set -euo pipefail

  # dnsmasq expects domain suffixes to start with a dot, so add it if it's not there already
  if [[ "{{domain}}" != .* ]]; then
    echo ".{{domain}}"
  else
    echo "{{domain}}"
  fi

populate-ipset server-own-ip error-code: (util::assert-envs-set error-code "INTERNET_ALLOWLIST_DOMAINS")
  #!/usr/bin/env bash
  set -euo pipefail

  for domain in $INTERNET_ALLOWLIST_DOMAINS; do
    just log debug "Resolving allowlisted domain '$domain' to populate ipset with its IP addresses"
    dig +time=1 +tries=1 @{{server-own-ip}} "$domain" A >/dev/null 2>&1 || true
  done
