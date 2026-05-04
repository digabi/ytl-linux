remove-rule table chain error-code +rule-spec:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking iptables rule for deletion from table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
  while iptables --wait --table {{table}} --check {{chain}} {{rule-spec}} 2> /dev/null; do
    just log debug "Deleting iptables rule from table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
    if ! iptables --wait --table {{table}} --delete {{chain}} {{rule-spec}}; then
      just log error "Failed to delete iptables rule from table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
      exit {{error-code}}
    fi
  done
  just log debug "Done deleting iptables rules from table {{table}}, chain {{chain}} with specification: {{rule-spec}}"

remove-rules-by-comment table chain comment error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "In order to remove rules by comment, making sure table {{table}}, chain {{chain}} exists"
  if ! iptables --wait --table {{table}} --list {{chain}} --line-numbers --numeric > /dev/null 2>&1; then
    just log error "Failed to list iptables chain {{chain}} in table {{table}} while deleting rules with comment: {{comment}}"
    exit {{error-code}}
  fi

  while line_number=$(
    iptables --wait --table {{table}} --list {{chain}} --line-numbers --numeric |
      awk -v comment="{{comment}}" 'index($0, "/* " comment " */") > 0 { print $1 }' |
      tail -n 1
  ) && [[ -n "$line_number" ]]; do
    just log debug "Deleting iptables rule number $line_number from table {{table}}, chain {{chain}} with comment: {{comment}}"
    if ! iptables --wait --table {{table}} --delete {{chain}} "$line_number"; then
      just log error "Failed to delete iptables rule number $line_number from table {{table}}, chain {{chain}} with comment: {{comment}}"
      exit {{error-code}}
    fi
  done
  just log debug "Done deleting iptables rules from table {{table}}, chain {{chain}} with comment: {{comment}}"

add-rule table chain error-code +rule-spec:
    #!/usr/bin/env bash
    set -euo pipefail

    just log debug "Checking if we need to add iptables rule to table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
    if ! iptables --wait --table {{table}} --check {{chain}} {{rule-spec}} 2> /dev/null; then
      just log debug "Need to add iptables rule to table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
      if ! iptables --wait --table {{table}} --append {{chain}} {{rule-spec}}; then
        just log error "Failed to add iptables rule to table {{table}}, chain {{chain}} with specification: {{rule-spec}}"
        exit {{error-code}}
      fi
    fi
    just log debug "Done adding iptables rule to table {{table}}, chain {{chain}} with specification: {{rule-spec}}"

flush-and-delete-chain table chain error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  if ! iptables --wait --table {{table}} --list {{chain}} --line-numbers --numeric > /dev/null 2>&1; then
    just log debug "Skipping flush and delete, as iptables chain {{chain}} in table {{table}} does not exist"
    exit 0
  fi

  just log debug "Flushing iptables chain {{chain}} in table {{table}}"
  if ! iptables --wait --table {{table}} --flush {{chain}}; then
    just log error "Failed to flush iptables chain {{chain}} in table {{table}}"
    exit {{error-code}}
  fi

  just log debug "Deleting iptables chain {{chain}} in table {{table}}"
  if ! iptables --wait --table {{table}} --delete-chain {{chain}}; then
    just log error "Failed to delete iptables chain {{chain}} in table {{table}}"
    exit {{error-code}}
  fi

  just log debug "Done flushing and deleting iptables chain {{chain}} in table {{table}}"

recreate-chain table chain error-code:
  #!/usr/bin/env bash
  set -euo pipefail

  just iptables flush-and-delete-chain {{table}} {{chain}} {{error-code}}

  just log debug "Adding iptables chain {{chain}} to table {{table}}"
  if ! iptables --wait --table {{table}} --new-chain {{chain}}; then
    just log error "Failed to add iptables chain {{chain}} to table {{table}}"
    exit {{error-code}}
  fi

  just log debug "Done adding iptables chain {{chain}} to table {{table}}"