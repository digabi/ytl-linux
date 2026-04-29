debug +messages:
  @echo "DEBUG: {{ messages }}"

info +messages:
  @echo "INFO: {{ messages }}"

error +messages:
  @echo "ERROR: {{ messages }}" >&2