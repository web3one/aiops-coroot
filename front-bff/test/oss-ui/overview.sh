#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

echo "Testing Group Overview..."
api_request "GET" "/overview/build"

echo "Testing Service Open..."
api_request "GET" "/service-open/build"
api_request "GET" "/service-open"
api_request "GET" "/service-open/formId"
