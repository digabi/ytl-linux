#!/usr/bin/env bash

set -euo pipefail

## This script is used when installing digabi2 server on Ubuntu
## Current location: https://static.abitti.fi/abitti-2-test/init-digabi2-package-repositories.sh

## Init Docker apt repository if not found (https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)
if ! test -f /etc/apt/sources.list.d/docker.list; then
  echo "Docker apt repository not initialized, initializing now"

  sudo apt-get update
  sudo apt-get install ca-certificates curl
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
else
  echo "Docker apt repository already initialized"
fi

## Init YTL apt repository if not found
if ! test -f /etc/apt/sources.list.d/ytl-linux.list; then
  echo "YTL apt repository not initialized, initializing now"

  wget -qO- https://linux.abitti.fi/apt-signing-key.pub | sudo tee /etc/apt/trusted.gpg.d/ytl-linux.asc
  sudo bash -c 'echo "deb https://linux.abitti.fi/deb ytl-linux main" >/etc/apt/sources.list.d/ytl-linux.list'
  sudo apt update
else
  echo "YTL apt repository already initialized"
fi



