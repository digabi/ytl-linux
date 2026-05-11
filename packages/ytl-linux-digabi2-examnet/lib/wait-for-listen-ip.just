mod util

EXIT_CODE_GENERIC_ERROR := env('EXIT_CODE_GENERIC_ERROR')

start: \
  (util::assert-envs-set EXIT_CODE_GENERIC_ERROR
    "PATH_SERVER_OWN_IP"
    "PATH_NET_DEVICE_LAN_CONF"
  )
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ! -f "$PATH_SERVER_OWN_IP" || ! -f "$PATH_NET_DEVICE_LAN_CONF" ]]; then
    echo "examnet not configured, skipping wait"
    exit 0
  fi

  SERVER_OWN_IP=$(cat "$PATH_SERVER_OWN_IP")
  NET_DEVICE_LAN=$(cat "$PATH_NET_DEVICE_LAN_CONF")

  echo "Waiting for $SERVER_OWN_IP on $NET_DEVICE_LAN..."
  for _ in $(seq 1 30); do
    if ip -4 addr show scope global dev "$NET_DEVICE_LAN" 2>/dev/null | grep -q "inet ${SERVER_OWN_IP}/"; then
      echo "OK: $SERVER_OWN_IP plumbed on $NET_DEVICE_LAN"
      exit 0
    fi
    sleep 1
  done

  echo "Timeout: $SERVER_OWN_IP not plumbed on $NET_DEVICE_LAN after 30s" >&2
  exit 1
