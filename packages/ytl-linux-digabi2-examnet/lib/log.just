debug +messages:
  @echo "DEBUG: {{ messages }}"

info +messages:
  @echo "INFO: {{ messages }}"

warn +messages:
  @echo "WARN: {{ messages }}"

error +messages:
  @echo "ERROR: {{ messages }}" >&2