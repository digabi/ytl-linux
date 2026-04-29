remove-school-domain-entries path-etc-hosts error-code:
  #!/usr/bin/env bash
  set -uo pipefail

  just log debug "Removing school domain entries from {{path-etc-hosts}}"

  tmpfile="{{path-etc-hosts}}.tmp"
  if ! sed '/^# BEGIN SCHOOL DOMAIN ENTRIES$/,/^# END SCHOOL DOMAIN ENTRIES$/d' "{{path-etc-hosts}}" > "$tmpfile"; then
    just log error "Failed to remove school domain entries from {{path-etc-hosts}}"
    rm -f "$tmpfile"
    exit {{error-code}}
  fi

  if ! cat "$tmpfile" | sudo tee "{{path-etc-hosts}}" > /dev/null; then
    just log error "Failed to write updated hosts file to {{path-etc-hosts}} after removing school domain entries"
    rm -f "$tmpfile"
    exit {{error-code}}
  fi

  rm -f "$tmpfile"

  just log debug "Successfully removed school domain entries from {{path-etc-hosts}}"

add-school-domain-entries path-etc-hosts school-domain-entries error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log info "Adding school domain entries to {{path-etc-hosts}}"

  {
    echo "# BEGIN SCHOOL DOMAIN ENTRIES"
    echo "{{school-domain-entries}}"
    echo "# END SCHOOL DOMAIN ENTRIES"
  } | sudo tee -a "{{path-etc-hosts}}" > /dev/null || {
    just log error "Failed to add school domain entries to {{path-etc-hosts}}"
    exit {{error-code}}
  }

  just log info "Successfully added school domain entries to {{path-etc-hosts}}"