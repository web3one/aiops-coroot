#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

BUCKET_ID="test-bucket-id"

echo "Testing Bucket List..."
api_request "GET" "/bucket/list/build"
api_request "GET" "/bucket/list"
api_request "GET" "/bucket/list/formId"

echo "Testing Bucket Create..."
api_request "GET" "/bucket/create/build"
api_request "GET" "/bucket/create"
api_request "GET" "/bucket/create/formId"

# POST validate example
api_request "POST" "/bucket/create/validate" '{"bucket_create_content_description": "test"}'

echo "Testing Bucket Detail..."
api_request "GET" "/bucket/detail/build?id=${BUCKET_ID}"
api_request "GET" "/bucket/detail"
api_request "GET" "/bucket/detail/formId"

echo "Testing Bucket Delete..."
api_request "GET" "/bucket/delete/build?id=${BUCKET_ID}"
api_request "GET" "/bucket/delete"
api_request "GET" "/bucket/delete/formId"
