mod util 'util.just'

EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

restart-bouncer net-device-wan net-device-lan server-number:
  #!/usr/bin/env bash
  set -euo pipefail

  just util restart-systemd-unit ytl-linux-digabi2-examnet.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util restart-systemd-unit ytl-linux-digabi2-examnet-discovery.timer $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util restart-systemd-unit ytl-linux-digabi2-examnet-discovery.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
