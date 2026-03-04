#!/usr/bin/env bash
# Common configuration and helper functions for OSS UI tests

# Default Configuration
#export BASE_URL=${BASE_URL:-http://oss-default.dc4-faas.fzyun.io/api/v1}
#export BASE_URL=${BASE_URL:-http://127.0.0.1:3000/api/v1}
export BASE_URL=${BASE_URL:-http://172.19.206.129:3000/api/v1}
export USER_ACCOUNT=${USER_ACCOUNT:-jiaql}
export CURRENT_ORG=${CURRENT_ORG:-dc4}
export CURRENT_REGION=${CURRENT_REGION:-dc4}
export CURRENT_GROUP=${CURRENT_GROUP:-reg-01jsnhvk699qd6aqyj359z2fpe}
export CURRENT_PROJECT=${CURRENT_PROJECT:-pmp-01jye32jyp6p0efb9a18xr5gnf}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Generate Auth Token if not provided
if [[ -z "${AUTH_TOKEN:-}" ]]; then
  echo "Generating dummy JWT token..."
  AUTH_TOKEN="$(python3 - <<'PY'
import base64, json, os, time
def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")
header = {"alg": "HS256", "typ": "JWT"}
payload = {
    "preferred_username": os.environ.get("USER_ACCOUNT", "test-user"),
    "exp": int(time.time()) + 3600,
}
token = f"{b64url(json.dumps(header).encode())}.{b64url(json.dumps(payload).encode())}.x"
print(token)
PY
)"
  export AUTH_TOKEN
fi

# Helper function to make API requests
# Usage: api_request <METHOD> <ENDPOINT> [DATA]
api_request() {
  local method=$1
  local endpoint=$2
  local data=${3:-}
  
  local url="${BASE_URL}${endpoint}"
  
  echo -e "${GREEN}[${method}] ${url}${NC}"
  
  local tmp_body=$(mktemp)
  local http_code
  
  local cmd=(curl -sS -X "${method}" -w "%{http_code}" -o "$tmp_body")
  
  # Add Headers
  cmd+=(-H "Authorization: Bearer ${AUTH_TOKEN}")
  cmd+=(-H "Current-Org: ${CURRENT_ORG}")
  cmd+=(-H "Current-Region: ${CURRENT_REGION}")
  cmd+=(-H "Current-Group: ${CURRENT_GROUP}")
  if [[ -n "${CURRENT_PROJECT}" ]]; then
    cmd+=(-H "Current-Project: ${CURRENT_PROJECT}")
  fi
  cmd+=(-H "Content-Type: application/json")
  
  # Add Data
  if [[ -n "${data}" ]]; then
    echo "Body: ${data}"
    cmd+=(-d "${data}")
  fi
  
  cmd+=("${url}")
  
  # Execute
  http_code=$("${cmd[@]}")
  local curl_status=$?

  if [[ $curl_status -ne 0 ]]; then
     echo -e "${RED}FAILED: Curl error (exit code ${curl_status})${NC}"
     if [[ -n "${FAILURE_LOG:-}" ]]; then
        echo "[${method}] ${endpoint} - Curl connection error (code ${curl_status})" >> "$FAILURE_LOG"
     fi
     rm -f "$tmp_body"
     return
  fi
  
  # Process Output
  if [ -s "$tmp_body" ]; then
      python3 - "$tmp_body" <<'PY' || cat "$tmp_body"
import json
import sys

try:
    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)
    json.dump(data, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
except Exception:
    raise
PY
  else
      echo "(Empty Response)"
  fi
  echo "" # New line
  
  # Check for errors
  local is_failure=0
  local error_msg=""
  
  if [[ -z "$http_code" ]]; then
      http_code=0
  fi

  if [[ "$http_code" -ge 400 ]]; then
    is_failure=1
    error_msg="HTTP ${http_code}"
  else
     # Check for application error (status != 0)
     local app_status
     app_status=$(python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 0))" < "$tmp_body" 2>/dev/null)
     
     if [[ -n "$app_status" && "$app_status" != "0" ]]; then
       is_failure=1
       error_msg="App Error (status: ${app_status})"
     fi
  fi

  if [[ "$is_failure" -eq 1 ]]; then
      echo -e "${RED}FAILED: ${error_msg}${NC}"
      if [[ -n "${FAILURE_LOG:-}" ]]; then
          echo "[${method}] ${endpoint} - ${error_msg}" >> "$FAILURE_LOG"
      fi
  fi
  
  rm -f "$tmp_body"
}
