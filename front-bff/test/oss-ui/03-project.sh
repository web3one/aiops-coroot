#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

echo "Testing Project Setting..."
api_request "GET" "/project/setting/build"
api_request "GET" "/project/setting"
api_request "GET" "/project/setting/formId"

echo "Testing Project Members Admin..."
api_request "GET" "/project/members/admin/build"
api_request "GET" "/project/members/admin"
api_request "GET" "/project/members/admin/formId"
