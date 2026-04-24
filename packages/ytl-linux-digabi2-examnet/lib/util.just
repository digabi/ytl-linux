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
