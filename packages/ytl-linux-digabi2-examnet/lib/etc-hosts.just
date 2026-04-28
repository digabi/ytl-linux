remove-school-domain-entries path-etc-hosts error-code:
    #!/usr/bin/env bash
    set -uo pipefail

    just log debug "Removing school domain entries from {{path-etc-hosts}}"

    if ! sed -i '' '/^# BEGIN SCHOOL DOMAIN ENTRIES$/,/^# END SCHOOL DOMAIN ENTRIES$/d' "{{path-etc-hosts}}"; then
      just log error "Failed to remove school domain entries from {{path-etc-hosts}}"
      exit {{error-code}}
    fi

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