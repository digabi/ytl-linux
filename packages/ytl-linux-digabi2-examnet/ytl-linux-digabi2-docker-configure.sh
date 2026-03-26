#!/usr/bin/env bash

set -euo pipefail

readonly PATH_DOCKER=/etc/docker
readonly PATH_DOCKER_DAEMON_CONF=$PATH_DOCKER/daemon.json
readonly PATH_TEMPLATES=/etc/ytl-linux-digabi2-examnet/templates
readonly PATH_DOCKER_DAEMON_CONF_TEMPLATE=$PATH_TEMPLATES/docker-daemon.json.template

function restart_docker() {
    /usr/bin/systemctl restart docker
}

function get_available_ip_range() {
    _ALLOWED_IP_RANGES=("10.0." "192.168." "172.17.")

    for range in "${_ALLOWED_IP_RANGES[@]}"; do
        _USED=false
        for reserved in "$@"; do
            if [[ $reserved == $range* ]]; then
                _USED=true
                break
            fi
        done
        if [[ "$_USED" == false ]]; then
            # return the first available
            echo "$range"
            return
        fi
    done
    exit 1
}

DOCKER_NETWORK_PREFIX=$(get_available_ip_range "$@")
DOCKER_NETWORK_DNS_RESOLVER_IP="$DOCKER_NETWORK_PREFIX"0.1
DOCKER_NETWORK_POOL_BASE_IP="$DOCKER_NETWORK_PREFIX"0.0

export DOCKER_NETWORK_DNS_RESOLVER_IP
export DOCKER_NETWORK_POOL_BASE_IP

echo "Created Docker configuration, writing to $PATH_DOCKER_DAEMON_CONF"
CONTENTS="$(envsubst < $PATH_DOCKER_DAEMON_CONF_TEMPLATE)"
echo "$CONTENTS"

mkdir -p "$PATH_DOCKER"
echo -e "$CONTENTS" > "$PATH_DOCKER_DAEMON_CONF"
restart_docker
