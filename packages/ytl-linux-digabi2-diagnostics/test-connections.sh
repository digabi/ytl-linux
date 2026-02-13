#!/usr/bin/env bash

set -euo pipefail

timestamp=$(date +"%Y%m%d-%H%M%S")
log_file="naksu2-network-test-${timestamp}.log"

# Write all output to both stdout and a log file
exec > >(tee -a "$log_file") 2>&1

ENDPOINTS=(
  "static.abitti.fi|Abitti static versions JSON|https://static.abitti.fi/naksu2/digabi2-versions-v2.json"
  "linux.abitti.fi|Naksu 2 latest version metadata|https://linux.abitti.fi/meta/naksu2-latest-version.json"
  "85t03rgks5.execute-api.eu-north-1.amazonaws.com|Docker compose generator API|https://85t03rgks5.execute-api.eu-north-1.amazonaws.com/production/generate-docker-compose"
  "koe.ylioppilastutkinto.fi|Exam credentials endpoint|https://koe.ylioppilastutkinto.fi/get-credentials"
  "sayo.production.yo-prod.ylioppilastutkinto.fi|School certificate endpoint|https://sayo.production.yo-prod.ylioppilastutkinto.fi/get-school-certificate"
  "863419159770.dkr.ecr.eu-north-1.amazonaws.com|AWS ECR registry for certificate-creator image|https://863419159770.dkr.ecr.eu-north-1.amazonaws.com/v2/"
  "s3.eu-north-1.amazonaws.com|AWS S3 eu-north-1 + naksu-logs bucket|https://s3.eu-north-1.amazonaws.com/abitti-prod.abitti-prod-cdk.naksu-logs"
)

print_ip_addresses() {
  echo "  IP addresses:"

  # Linux: use ip -o -4 addr show
  if command -v ip >/dev/null 2>&1; then
    ip -o -4 addr show 2>/dev/null | awk '
      {
        iface=$2
        addr=$4
        sub(/\/[0-9]+$/, "", addr)
        gsub(":", "", iface)
        print "    " iface ": " addr
      }
    '
    return
  fi

  # macOS / BSD: use ifconfig
  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig 2>/dev/null | awk '
      /^[a-zA-Z0-9]/ { iface=$1; gsub(":", "", iface) }
      /inet / && $2 != "127.0.0.1" {
        print "    " iface ": " $2
      }
    '
    return
  fi

  echo "    (could not detect IP addresses)"
}

now_local=$(date +"%Y-%m-%d %H:%M:%S %Z")
now_utc=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo "Running quick connectivity checks for core Naksu 2 endpoints"
echo "  Log file   : $log_file"
echo "  Time (local): $now_local"
echo "  Time (UTC)  : $now_utc"
print_ip_addresses
echo

total=0
failed=0
declare -a failed_hosts=()

for entry in "${ENDPOINTS[@]}"; do
  IFS='|' read -r host desc url <<<"$entry"
  total=$((total + 1))

  # Derive port from URL scheme (https -> 443, http -> 80)
  scheme="${url%%://*}"
  case "$scheme" in
    https) port=443 ;;
    http) port=80 ;;
    *) port="?" ;;
  esac

  echo "============================================================"
  echo "Host : $host"
  echo "Desc : $desc"
  echo "Port : $port"

  host_failed=0

  # 1) DNS resolution
  if command -v getent >/dev/null 2>&1; then
    dns_output=$(getent hosts "$host" || true)
    if [[ -n "${dns_output}" ]]; then
      dns_ip=$(echo "$dns_output" | awk '{print $1}' | head -n1)
      echo "DNS  : OK ($dns_ip)"
      dns_ok=1
    else
      echo "DNS  : FAIL (no DNS result)"
      dns_ok=0
      host_failed=1
    fi
  elif command -v host >/dev/null 2>&1; then
    dns_output=$(host "$host" 2>/dev/null || true)
    if echo "$dns_output" | grep -q "has address"; then
      dns_ip=$(echo "$dns_output" | awk '/has address/ {print $4; exit}')
      echo "DNS  : OK ($dns_ip)"
      dns_ok=1
    else
      echo "DNS  : FAIL (no DNS result)"
      dns_ok=0
      host_failed=1
    fi
  else
    echo "DNS  : SKIP (no getent/host available)"
    dns_ok=1
  fi

  # 2) TCP connectivity to port (fast sanity check)
  tcp_ok=1
  if command -v nc >/dev/null 2>&1; then
    # Use netcat if available; -z for scan, -v for message, -w for timeout
    if nc -vz -w 3 "$host" "$port" >/dev/null 2>&1; then
      echo "TCP  : OK (nc connect succeeded)"
    else
      echo "TCP  : FAIL (nc could not connect)"
      tcp_ok=0
      host_failed=1
    fi
  elif command -v timeout >/dev/null 2>&1; then
    # Fallback to /dev/tcp with timeout if nc is not available
    if timeout 3 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
      echo "TCP  : OK (port reachable via /dev/tcp)"
    else
      echo "TCP  : FAIL (cannot open TCP connection via /dev/tcp)"
      tcp_ok=0
      host_failed=1
    fi
  else
    echo "TCP  : SKIP (no nc or timeout; relying on HTTP test)"
  fi

  # 3) HTTPS/HTTP request
  http_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" || echo "000")

  # Treat only real 3-digit HTTP codes as success.
  if [[ "$http_code" =~ ^[0-9]{3}$ && "$http_code" != "000" ]]; then
    echo "HTTP : OK (HTTP $http_code)"
  else
    echo "HTTP : FAIL (no HTTP response within timeout or invalid HTTP status: $http_code)"
    host_failed=1
  fi

  # Short hint for IT
  if [[ "${dns_ok:-1}" -eq 0 ]]; then
    echo "Hint : Check DNS configuration and that this hostname is allowed/resolvable from the server."
  elif [[ "${tcp_ok:-1}" -eq 0 ]]; then
    echo "Hint : Check firewall/proxy rules for outbound TCP $port to this host."
  elif [[ "$http_code" == "000" ]]; then
    echo "Hint : DNS and TCP look OK but HTTP failed; check TLS interception, proxy settings, and outbound HTTPS rules."
  fi

  if [[ "$host_failed" -eq 1 ]]; then
    failed=$((failed + 1))
    failed_hosts+=("$host ($desc)")
  fi

  echo
done

echo "============================================================"
echo "Summary:"
echo "  Total endpoints tested : $total"
echo "  Endpoints OK           : $((total - failed))"
echo "  Endpoints FAILED       : $failed"

if [[ "$failed" -gt 0 ]]; then
  echo
  echo "FAILED endpoints:"
  for item in "${failed_hosts[@]}"; do
    echo "  - $item"
  done
  echo
  echo "One or more connectivity checks failed."
  echo "Full report saved to: $log_file"
  exit 1
else
  echo
  echo "All connectivity checks passed."
  echo "Full report saved to: $log_file"
fi


