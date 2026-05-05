set working-directory := "../"

[private]
read-file path description error-code:
  #!/usr/bin/env bash
  set -uo pipefail

  if [[ ! -f "{{path}}" ]]; then
    just log error "Could not read '{{description}}': File '{{path}}' does not exist"
    exit {{error-code}}
  fi

  if ! cat "{{path}}"; then
    just log error "Failed to read '{{description}}' from file '{{path}}'"
    exit {{error-code}}
  fi

[private]
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

  echo -e '{{content}}' > "{{path}}"

  # Change file owner
  if [[ -n "{{owner}}" ]]; then
    chown "{{owner}}" "{{path}}"
  fi

[private]
remove-file path:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Attempting to remove file '{{path}}'"

  if [[ ! -f "{{path}}" ]]; then
    just log debug "File '{{path}}' does not exist, skipping removal"
    exit 0
  fi

  just log debug "Removing file '{{path}}'"

  if ! rm -f "{{path}}"; then
    just log error "Failed to remove file '{{path}}'"
    exit $EXIT_CODE_CANNOT_REMOVE_FILES
  fi

[private]
empty-directory path:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Clearing directory '{{path}}'"

  if ! rm -rf {{path}}/*; then
    just log error "Failed to clear directory '{{path}}'"
    exit $EXIT_CODE_CANNOT_REMOVE_FILES
  fi

[private]
assert-file-exists file-path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if file '{{file-path}}' exists"

  if [[ ! -f "{{file-path}}" ]]; then
    just log error "Required file '{{file-path}}' does not exist"
    exit {{error-code}}
  fi

[private]
assert-file-contents file-path expected-contents error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just fs assert-file-exists "{{file-path}}" {{error-code}}

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

[private]
get-dir-owner path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if [[ ! -d "{{path}}" ]]; then
    just log error "Directory '{{path}}' does not exist"
    exit {{error-code}}
  fi

  stat -c '%U:%G' "{{path}}"

create-file-from-template destination-path template-path error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Creating file {{destination-path}} from template '{{template-path}}'"

  if ! CONTENT="$(envsubst < "{{template-path}}")"; then
    just log error "Failed to substitute variables into template file '{{template-path}}'"
    exit {{error-code}}
  fi

  just fs write-file "{{destination-path}}" "$CONTENT"
