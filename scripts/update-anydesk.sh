#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../debs

rm -f anydesk-meb*.deb
gh release download --repo digabi/anydesk-meb --pattern '*.deb'
