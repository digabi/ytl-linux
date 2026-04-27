[private]
enable unit-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Enabling systemd unit '{{unit-name}}'"

  if ! systemctl enable {{unit-name}}; then
    just log error "Failed to enable systemd unit '{{unit-name}}'"
    exit $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  fi

[private]
is-enabled unit-name:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! ENABLED=systemctl is-enabled {{unit-name}}; then
    just log error "Failed to check if systemd unit '{{unit-name}}' is enabled" >&2
    exit $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  fi

  echo "$ENABLED"

[private]
restart unit-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Restarting systemd unit '{{unit-name}}'"

  if ! systemctl restart "{{unit-name}}"; then
    just log error "Failed to restart systemd unit '{{unit-name}}'"
    exit $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  fi

  just log info "Successfully restarted systemd unit '{{unit-name}}'"


# TODO: Flaginä edellisessä?
[private]
restart-if-enabled unit-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if systemd unit '{{unit-name}}' is enabled before attempting restart"

  if [[ $(systemctl is-enabled {{unit-name}}) == "enabled" ]]; then
    just log debug "Systemd unit '{{unit-name}}' is enabled, restarting"
    just systemd restart-unit "{{unit-name}}"
  else
    just log debug "Systemd unit '{{unit-name}}' is not enabled, skipping restart"
  fi

[private]
disable unit-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Disabling systemd unit '{{unit-name}}'"

  if ! systemctl disable --now "{{unit-name}}"; then
    just log error "Failed to disable systemd unit '{{unit-name}}'"
    exit $EXIT_CODE_CANNOT_CHANGE_SERVICE_STATE
  fi

  just log info "Successfully disabled systemd unit '{{unit-name}}'"
