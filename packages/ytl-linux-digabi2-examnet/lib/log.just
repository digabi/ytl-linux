debug message:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "DEBUG: {{ message }}"

info message:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "INFO: {{ message }}"

error message:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "ERROR: {{ message }}" >&2