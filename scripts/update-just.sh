#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

# Remove old just tarball
rm -rf packages/ytl-linux-tasks/vendor/*

cd packages/ytl-linux-tasks/vendor

# Download latest release
gh release download --repo casey/just --pattern "just-*-x86_64-unknown-linux-musl.tar.gz"
