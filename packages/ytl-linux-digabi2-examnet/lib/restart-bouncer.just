mod util

EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

# FIXME: Käyttämättömiä argumentteja
restart-bouncer net-device-wan net-device-lan server-number:
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Restarting bouncer and discovery services for server number {{server-number}}"

  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet-discovery.timer $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  just util restart-systemd-unit-if-enabled ytl-linux-digabi2-examnet-discovery.service $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE

  just log info "Successfully restarted bouncer and discovery services for server number {{server-number}}"
