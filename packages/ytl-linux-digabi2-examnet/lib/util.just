set working-directory := "../"
mod log 'log.just'

[private]
assert-user-is-root:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ${TEST_MODE:-} != "test" && $EUID -ne 0 ]]; then
    just log error "This script must be run as root"
    exit $EXIT_CODE_MUST_BE_ROOT
  fi

read-file path description error-code:
  #!/usr/bin/env bash
  set -uo pipefail

  if [[ ! -f "{{path}}" ]]; then
    just log error "Could not read '{{description}}': File '{{path}}' does not exist" >&2
    exit {{error-code}}
  fi

  if ! cat "{{path}}"; then
    just log error "Failed to read '{{description}}' from file '{{path}}'"
    exit {{error-code}}
  fi

write-file path content owner="":
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Writing to file '{{path}}'"

  DIRECTORY=$(dirname "{{path}}")

  if [[ ! -d "$DIRECTORY" ]]; then
    mkdir -p "$DIRECTORY"

    # Change directory owner
    if [[ -n "{{owner}}" ]]; then
      chown "{{owner}}" "$DIRECTORY"
    fi
  fi

  echo -e "{{content}}" > "{{path}}"

  # Change file owner
  if [[ -n "{{owner}}" ]]; then
    chown "{{owner}}" "{{path}}"
  fi

remove-file file-path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Attempting to remove file '{{file-path}}'"

  if [[ -f "{{file-path}}" ]]; then
    just log debug "Removing file '{{file-path}}'"
    if ! rm -f "{{file-path}}"; then
      just log error "Failed to remove file '{{file-path}}'"
      exit {{error-code}}
    fi
  else
    just log debug "File '{{file-path}}' does not exist, skipping removal"
  fi

assert-file-exists file-path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if file '{{file-path}}' exists"

  if [[ ! -f "{{file-path}}" ]]; then
    just log error "Required file '{{file-path}}' does not exist"
    exit {{error-code}}
  fi

assert-file-contents file-path expected-contents error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just util assert-file-exists "{{file-path}}" {{error-code}}

  just log debug "Checking contents of file '{{file-path}}'"
  ACTUAL_CONTENTS=$(cat "{{file-path}}")

  if [[ "$ACTUAL_CONTENTS" != "{{expected-contents}}" ]]; then
    just log error "Contents of file '{{file-path}}' do not match expected contents"
    just log error "Expected contents:"
    just log error "{{expected-contents}}"
    just log error "Actual contents:"
    just log error "$ACTUAL_CONTENTS"
    exit {{error-code}}
  fi

assert-program-exists program-name:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! command -v "{{program-name}}" &> /dev/null; then
    just log error "ERROR: Required program '{{program-name}}' is not installed or not in PATH"
    exit 1
  fi

assert-envs-set error-code +var-names:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking that these required environment variables are set: {{var-names}}"

  for var_name in {{var-names}}; do
    if [[ -z "${!var_name:-}" ]]; then
      just log error "Required environment variable '$var_name' is not set"
      exit {{error-code}}
    fi
  done

is-systemd-unit-enabled unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! systemctl is-enabled {{unit-name}}; then
    just log error "Failed to check if systemd unit '{{unit-name}}' is enabled" >&2
    exit {{error-code}}
  fi

restart-systemd-unit unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Restarting systemd unit '{{unit-name}}'"

  if ! systemctl restart "{{unit-name}}"; then
    just log error "Failed to restart systemd unit '{{unit-name}}'"
    exit {{error-code}}
  fi

  just log info "Successfully restarted systemd unit '{{unit-name}}'"

restart-systemd-unit-if-enabled unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if systemd unit '{{unit-name}}' is enabled before attempting restart"
  ENABLED=$(just util is-systemd-unit-enabled "{{unit-name}}" {{error-code}})
  if [[ "$ENABLED" == "enabled" ]]; then
    just log debug "Systemd unit '{{unit-name}}' is enabled"

    just util restart-systemd-unit "{{unit-name}}" {{error-code}}
  fi

disable-systemd-unit unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Disabling systemd unit '{{unit-name}}'"

  if ! systemctl disable --now "{{unit-name}}"; then
    just log error "Failed to disable systemd unit '{{unit-name}}'"
    exit {{error-code}}
  fi

  just log info "Successfully disabled systemd unit '{{unit-name}}'"
