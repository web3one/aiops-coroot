#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

BUCKET_ID="test-bucket-id"
USER_ID="test-user-id"

echo "Testing Bucket Member Add (1)..."
api_request "GET" "/member/add/build?bucketId=${BUCKET_ID}"
api_request "GET" "/member/add"
api_request "GET" "/member/add/formId"

echo "Testing Bucket Member Detail..."
api_request "GET" "/member/detail/build?id=${USER_ID}&bucketId=${BUCKET_ID}"
api_request "GET" "/member/detail"
api_request "GET" "/member/detail/formId"

echo "Testing Bucket Member Edit..."
api_request "GET" "/member/edit/build?bucketId=${BUCKET_ID}&id=${USER_ID}"
api_request "GET" "/member/edit"
api_request "GET" "/member/edit/formId"
