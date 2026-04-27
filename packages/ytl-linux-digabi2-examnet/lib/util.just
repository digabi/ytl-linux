set working-directory := "../"

[private]
assert-user-is-root:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ${TEST_MODE:-} != "test" && $EUID -ne 0 ]]; then
    echo "Error: This script must be run as root"
    exit $EXIT_CODE_MUST_BE_ROOT
  fi

read-file path description error-code:
  #!/usr/bin/env bash
  set -uo pipefail

  echo "DEBUG: Trying to read '{{description}}' from file '{{path}}'" >&2

  if [[ ! -f "{{path}}" ]]; then
    echo "ERROR: Could not read '{{description}}': File '{{path}}' does not exist" >&2
    exit {{error-code}}
  fi

  if ! cat "{{path}}"; then
    echo "ERROR: Failed to read '{{description}}' from file '{{path}}'" >&2
    exit {{error-code}}
  fi

write-file path content owner="":
  #!/usr/bin/env bash
  set -euo pipefail

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

  if [[ -f "{{file-path}}" ]]; then
    echo "DEBUG: Removing file '{{file-path}}'"
    if ! rm -f "{{file-path}}"; then
      echo "ERROR: Failed to remove file '{{file-path}}'"
      exit {{error-code}}
    fi
  else
    echo "DEBUG: File '{{file-path}}' does not exist, skipping removal"
  fi

assert-file-exists file-path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ! -f "{{file-path}}" ]]; then
    echo "ERROR: Required file '{{file-path}}' does not exist"
    exit {{error-code}}
  fi

assert-file-contents file-path expected-contents error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just util assert-file-exists "{{file-path}}" {{error-code}}

  ACTUAL_CONTENTS=$(cat "{{file-path}}")

  if [[ "$ACTUAL_CONTENTS" != "{{expected-contents}}" ]]; then
    echo "ERROR: Contents of file '{{file-path}}' do not match expected contents"
    echo "Expected contents:"
    echo "{{expected-contents}}"
    echo "Actual contents:"
    echo "$ACTUAL_CONTENTS"
    exit {{error-code}}
  fi

assert-program-exists program-name:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! command -v "{{program-name}}" &> /dev/null; then
    echo "ERROR: Required program '{{program-name}}' is not installed or not in PATH"
    exit 1
  fi

assert-envs-set error-code +var-names:
  #!/usr/bin/env bash
  set -euo pipefail

  for var_name in {{var-names}}; do
    if [[ -z "${!var_name:-}" ]]; then
      echo "ERROR: Required environment variable '$var_name' is not set"
      exit {{error-code}}
    fi
  done

is-systemd-unit-enabled unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! systemctl is-enabled {{unit-name}}; then
    echo "ERROR: Failed to check if systemd unit '{{unit-name}}' is enabled" >&2
    exit {{error-code}}
  fi

restart-systemd-unit unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  echo "DEBUG: Restarting systemd unit '{{unit-name}}'"

  if ! systemctl restart "{{unit-name}}"; then
    echo "ERROR: Failed to restart systemd unit '{{unit-name}}'"
    exit {{error-code}}
  fi

  echo "INFO: Successfully restarted systemd unit '{{unit-name}}'"

restart-systemd-unit-if-enabled unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  ENABLED=$(just util is-systemd-unit-enabled "{{unit-name}}" {{error-code}})
  if [[ "$ENABLED" == "enabled" ]]; then
    echo "DEBUG: Systemd unit '{{unit-name}}' is enabled"

    just util restart-systemd-unit "{{unit-name}}" {{error-code}}
  fi

disable-systemd-unit unit-name error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! systemctl disable --now "{{unit-name}}"; then
    echo "ERROR: Failed to disable systemd unit '{{unit-name}}'"
    exit {{error-code}}
  fi

  echo "INFO: Successfully disabled systemd unit '{{unit-name}}'"
