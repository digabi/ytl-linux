mod fs
mod iptables
mod log
mod network
mod util

enable net-device-wan net-device-lan error-code: \
  (util::assert-envs-set error-code
    "INTERNET_ALLOWLIST_DOMAINS"
    "PATH_RSYSLOG_INTERNET_FORWARDING_CONF"
    "PATH_RSYSLOG_INTERNET_FORWARDING_CONF_TEMPLATE"
    "PATH_RSYSLOG_APPARMOR_LOCAL"
    "PATH_RSYSLOG_APPARMOR_LOCAL_TEMPLATE"
    "PATH_RSYSLOG_APPARMOR_PROFILE"
    "PATH_LOGROTATE_INTERNET_FORWARDING_CONF"
    "PATH_LOGROTATE_INTERNET_FORWARDING_CONF_TEMPLATE"
    "PATH_NAKSU2_LOGS_DIR"
    "PATH_INTERNET_FORWARDING_LOGS"
    "PATH_SYSCTL_EXAMNET_CONF"
    "INTERNET_ALLOWLIST_IPSET_NAME"
    "INTERNET_ALLOWLIST_FILTER_CHAIN"
    "INTERNET_ALLOWLIST_IPSET_TIMEOUT_SECONDS"
  ) \
  (network::assert-device-exists net-device-wan) \
  (network::assert-device-exists net-device-lan)
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Enabling internet forwarding for domains: $INTERNET_ALLOWLIST_DOMAINS"

  just internet-forwarding enable-kernel-ip-forwarding {{error-code}}

  # Remove possible existing iptables rules and recreate allowlist filter chain to ensure idempotency
  just internet-forwarding remove-iptables-rules-by-comment "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}
  just iptables recreate-chain filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}}

  # Recreate ipset
  just internet-forwarding flush-and-destroy-ipset "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}
  just log debug "Creating ipset '$INTERNET_ALLOWLIST_IPSET_NAME'"
  if ! ipset create "$INTERNET_ALLOWLIST_IPSET_NAME" hash:ip timeout "$INTERNET_ALLOWLIST_IPSET_TIMEOUT_SECONDS" -exist; then
    just log error "Failed to create ipset '$INTERNET_ALLOWLIST_IPSET_NAME'"
    exit {{error-code}}
  fi

  just internet-forwarding configure-logging {{error-code}}

  # Log new allowlisted flows
  just iptables add-rule filter $INTERNET_ALLOWLIST_FILTER_CHAIN {{error-code}} \
      --match conntrack --ctstate NEW \
      --match set --match-set "$INTERNET_ALLOWLIST_IPSET_NAME" dst \
      --match limit --limit 30/second --limit-burst 100 \
      --jump LOG --log-prefix "YTL_ALLOW_NEW-" --log-level 6

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

disable error-code: \
  (util::assert-envs-set error-code
    "PATH_SYSCTL_EXAMNET_CONF"
    "INTERNET_ALLOWLIST_IPSET_NAME"
    "INTERNET_ALLOWLIST_FILTER_CHAIN"
  )
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Disabling internet forwarding"

  just internet-forwarding remove-iptables-rules-by-comment "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}

  just iptables flush-and-delete-chain filter "$INTERNET_ALLOWLIST_FILTER_CHAIN" {{error-code}}

  just internet-forwarding flush-and-destroy-ipset "$INTERNET_ALLOWLIST_IPSET_NAME" {{error-code}}

  just internet-forwarding disable-kernel-ip-forwarding {{error-code}}

  just log info "Done disabling internet forwarding"

configure-logging error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Configuring logging for internet forwarding"

  # Allow syslog to write to log directory by adding syslog to group owning the log directory
  NAKSU2_LOGS_DIR_GROUP="$(just fs get-dir-group "$PATH_NAKSU2_LOGS_DIR" {{error-code}})"
  sudo usermod --append --groups "$NAKSU2_LOGS_DIR_GROUP" syslog

  # Create log file with right permissions
  NAKSU2_LOGS_DIR_OWNER="syslog:$NAKSU2_LOGS_DIR_GROUP"
  just log debug "Creating empty log file '$PATH_INTERNET_FORWARDING_LOGS' with owner '$NAKSU2_LOGS_DIR_OWNER'"
  just fs write-file "$PATH_INTERNET_FORWARDING_LOGS" "" "$NAKSU2_LOGS_DIR_OWNER"

  # Add write permissions for rsyslog to log dir and its parent directories
  LOGS_DIR_PARENTS=$(echo $PATH_NAKSU2_LOGS_DIR | tr '/' '\n')
  path=""
  for dir in $LOGS_DIR_PARENTS; do
    path="$path/$dir"
    just log debug "Adding write permissions for rsyslog to '$path'"
    sudo chmod g+wX "$path"
  done

  # Add rsyslog config to log allowed packets to a separate file for easier analysis
  export msg='$msg'
  just fs create-file-from-template "$PATH_RSYSLOG_INTERNET_FORWARDING_CONF" "$PATH_RSYSLOG_INTERNET_FORWARDING_CONF_TEMPLATE" {{error-code}}

  # Add logrotate config to rotate the separate log file
  just fs create-file-from-template "$PATH_LOGROTATE_INTERNET_FORWARDING_CONF" "$PATH_LOGROTATE_INTERNET_FORWARDING_CONF_TEMPLATE"  {{error-code}}
  just systemd restart logrotate

  # Add apparmor config to allow rsyslog to write to the log file
  just fs create-file-from-template "$PATH_RSYSLOG_APPARMOR_LOCAL" "$PATH_RSYSLOG_APPARMOR_LOCAL_TEMPLATE" {{error-code}}

  # Reload apparmor to apply the new apparmor config
  if ! apparmor_parser -r "$PATH_RSYSLOG_APPARMOR_PROFILE"; then
    just log error "Failed to reload apparmor profile '$PATH_RSYSLOG_APPARMOR_PROFILE'"
    exit {{error-code}}
  fi

  # Restart rsyslog to apply the new rsyslog config
  just systemd restart rsyslog


remove-iptables-rules-by-comment comment error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just iptables remove-rules-by-comment nat POSTROUTING {{comment}} {{error-code}}
  just iptables remove-rules-by-comment filter FORWARD {{comment}} {{error-code}}

flush-and-destroy-ipset ipset-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ipset list "{{ipset-name}}" > /dev/null 2>&1; then
    just log debug "Flushing and destroying ipset '{{ipset-name}}'"

    if ! ipset flush "{{ipset-name}}"; then
      just log error "Failed to flush ipset '{{ipset-name}}'"
      exit {{error-code}}
    fi
    just log debug "Flushed ipset '{{ipset-name}}'"

    if ! ipset destroy "{{ipset-name}}"; then
      just log error "Failed to destroy ipset '{{ipset-name}}'"
      exit {{error-code}}
    fi
    just log debug "Destroyed ipset '{{ipset-name}}'"
  else
    just log debug "Skipping flushing and destroying ipset '{{ipset-name}}' which does not exist"
  fi

enable-kernel-ip-forwarding error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Enabling kernel IP forwarding"

  if ! just fs write-file "$PATH_SYSCTL_EXAMNET_CONF" "net.ipv4.ip_forward=1"; then
    just log error "Failed to write kernel IP forwarding setting to '$PATH_SYSCTL_EXAMNET_CONF'"
    exit {{error-code}}
  fi

  if ! sysctl -w net.ipv4.ip_forward=1; then
    just log error "Failed to enable IP forwarding with sysctl"
    exit {{error-code}}
  fi

  just log debug "Successfully enabled kernel IP forwarding"

disable-kernel-ip-forwarding error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Disabling kernel IP forwarding"

  just fs remove-file "$PATH_SYSCTL_EXAMNET_CONF"

  if ! sysctl -w net.ipv4.ip_forward=0; then
    just log error "Failed to disable IP forwarding with sysctl"
    exit {{error-code}}
  fi

  just log debug "Successfully disabled kernel IP forwarding"

get-allowlisted-server-configuration +allowlisted-domains:
  #!/usr/bin/env bash
  set -euo pipefail

  # Forward allowlisted domains to upstream DNS (as defined by resolv-file=/etc/resolv.conf)
  for domain in {{allowlisted-domains}}; do
    echo "server=/$domain/#"
  done

get-allowlisted-ipset-configuration internet-allowlist-ipset-name +allowlisted-domains:
  #!/usr/bin/env bash
  set -euo pipefail

  # IP addresses of allowlisted domains are added to ipset that is used to allow forwarding traffic to those domains in iptables
  # Other domains are null-routed by address=/#/0.0.0.0 in the main configuration.
  for domain in {{allowlisted-domains}}; do
    echo "ipset=/$domain/{{internet-allowlist-ipset-name}}"
  done

populate-ipset server-own-ip error-code: \
  (util::assert-envs-set error-code "INTERNET_ALLOWLIST_DOMAINS")
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Populating ipset with IP addresses of allowlisted domains: $INTERNET_ALLOWLIST_DOMAINS"

  for domain in $INTERNET_ALLOWLIST_DOMAINS; do
    just log debug "Resolving allowlisted domain '$domain' to populate ipset with its IP addresses"
    if ! dig +time=1 +tries=1 @{{server-own-ip}} "$domain" A >/dev/null 2>&1; then
      just log warn "Failed to resolve allowlisted domain '$domain' using dig with server {{server-own-ip}}"
    fi
  done

  just log debug "Done populating ipset with IP addresses of allowlisted domains"

