#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../debs

rm -f naksu2*.deb
gh release download --repo digabi/naksu2 --pattern '*.deb'
