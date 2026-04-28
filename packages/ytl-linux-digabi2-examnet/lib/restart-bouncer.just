mod util

EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE := env('EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE')

# FIXME: Käyttämättömiä argumentteja
restart-bouncer net-device-wan net-device-lan server-number:
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Restarting bouncer and discovery services for server number {{server-number}}"

  just systemd restart-if-enabled ytl-linux-digabi2-examnet
  just systemd restart-if-enabled ytl-linux-digabi2-examnet-discovery.timer
  just systemd restart-if-enabled ytl-linux-digabi2-examnet-discovery.service

  just log info "Successfully restarted bouncer and discovery services for server number {{server-number}}"
