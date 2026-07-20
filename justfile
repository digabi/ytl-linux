mod update 'tasks/update.just'

# Lists all tasks in the order they appear in the justfile
[private]
default:
    @just --list --unsorted

# Format justfile
[private]
format:
    @just --unstable --fmt
    @for file in tasks/*.just; do just --unstable --fmt --justfile "$file"; done
