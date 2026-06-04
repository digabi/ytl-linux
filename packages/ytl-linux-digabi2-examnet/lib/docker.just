[private]
teardown-project project-name:
  #!/usr/bin/env bash
  set -euo pipefail

  just log debug "Checking if Docker Compose project '{{project-name}}' has containers running"

  if [ -n "$(docker compose -p {{project-name}} ps -q 2>/dev/null)" ]; then
    just log info "Docker Compose project '{{project-name}}' is running, tearing down"

    if ! docker compose -p {{project-name}} down > /dev/null; then
      just log error "Failed to tear down Docker Compose project '{{project-name}}'"
      exit $EXIT_CODE_CANNOT_RESTART_DOCKER
    fi

    just log debug "Pruning unused Docker networks"
    docker network prune -f > /dev/null

    just log info "Docker Compose project '{{project-name}}' torn down successfully"
  else
    just log debug "No containers found for Docker Compose project '{{project-name}}', skipping teardown"
  fi