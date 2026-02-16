#!/usr/bin/env bash

set -euo pipefail

timestamp=$(date +"%Y%m%d-%H%M%S")
log_file="exam-server-network-test-${timestamp}.log"

# Write all output to both stdout and a log file
exec > >(tee -a "$log_file") 2>&1

ENDPOINTS=(
  "static.abitti.fi|Server versions|https://static.abitti.fi/naksu2/digabi2-versions-v2.json"
  "linux.abitti.fi|Naksu 2 versions|https://linux.abitti.fi/meta/naksu2-latest-version.json"
  "85t03rgks5.execute-api.eu-north-1.amazonaws.com|Docker compose generator API|https://85t03rgks5.execute-api.eu-north-1.amazonaws.com/production/generate-docker-compose"
  "koe.ylioppilastutkinto.fi|Exam credentials endpoint|https://koe.ylioppilastutkinto.fi/get-credentials"
  "sayo.production.yo-prod.ylioppilastutkinto.fi|School certificate endpoint|https://sayo.production.yo-prod.ylioppilastutkinto.fi/get-school-certificate"
  "863419159770.dkr.ecr.eu-north-1.amazonaws.com|AWS ECR registry|https://863419159770.dkr.ecr.eu-north-1.amazonaws.com/v2/"
  "s3.eu-north-1.amazonaws.com|AWS S3 log bucket|https://s3.eu-north-1.amazonaws.com/abitti-prod.abitti-prod-cdk.naksu-logs"
)

print_ip_addresses() {
  echo "  IP addresses:"
  if ! ip -o -4 addr show 2>/dev/null | awk '
    {
      iface=$2
      addr=$4
      sub(/\/[0-9]+$/, "", addr)
      gsub(":", "", iface)
      print "    " iface ": " addr
    }
  '; then
    echo "    (could not detect IP addresses)"
  fi
}

now_local=$(date +"%Y-%m-%d %H:%M:%S %Z")
now_utc=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo "Running Abitti2 internet connectivity tests"
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

  # 2) TCP connectivity
  tcp_ok=1
  if nc -vz -w 3 "$host" "$port" >/dev/null 2>&1; then
    echo "TCP  : OK (nc connect succeeded)"
  else
    echo "TCP  : FAIL (nc could not connect)"
    tcp_ok=0
    host_failed=1
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

  # Short hint
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


