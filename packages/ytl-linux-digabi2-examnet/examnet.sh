#!/usr/bin/env bash

set -euo pipefail

# Shared constants are declared here since just does not have any good mechanism for such things

# TODO: Naksu uses exit codes 6, 20, 24, 25 so these should not be changed
# Exit code 1 is reserved for generic unexpected exits
export EXIT_CODE_MUST_BE_ROOT=2
export EXIT_CODE_NO_SUCH_NETWORK_DEVICE=3
export EXIT_CODE_INVALID_SERVER_NUMBER=4
export EXIT_CODE_INVALID_SERVER_NAME=5
export EXIT_CODE_SAME_DEVICE_FOR_WAN_AND_LAN=6
export EXIT_CODE_NO_IP_ON_NETWORK_DEVICE=7

export PATH_EXAMNET_CONFIG="${PATH_EXAMNET_CONFIG:-/etc/ytl-linux-digabi2-examnet/config/}"
export PATH_SERVER_FRIENDLY_NAME_CONF="$PATH_EXAMNET_CONFIG/server-friendly-name"
export PATH_NET_DEVICE_LAN_CONF="$PATH_EXAMNET_CONFIG/net-device-lan"
export PATH_NET_DEVICE_WAN_CONF="$PATH_EXAMNET_CONFIG/net-device-wan"
export PATH_SERVER_OWN_IP_CONF="$PATH_EXAMNET_CONFIG/server-own-ip"

export PATH_NETPLAN="${PATH_NETPLAN:-/etc/netplan/}"
export PATH_NETPLAN_CONF="$PATH_NETPLAN/50-cloud-init.yaml"

just "$@"
