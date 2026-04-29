mod log

[private]
assert-user-is-root:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ${TEST_MODE:-} != "test" && $EUID -ne 0 ]]; then
    just log error "This script must be run as root"
    exit $EXIT_CODE_MUST_BE_ROOT
  fi

[private]
assert-program-exists program-name:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! command -v "{{program-name}}" &> /dev/null; then
    just log error "ERROR: Required program '{{program-name}}' is not installed or not in PATH"
    exit $EXIT_CODE_GENERIC_ERROR
  fi

[private]
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
