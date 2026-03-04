#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://oss-default.dc4-faas.fzyun.io/api/v1}
API_URL=${API_URL:-/bucket/list}
USER_ACCOUNT=${USER_ACCOUNT:-jiaql}
CURRENT_ORG=${CURRENT_ORG:-dc4}
CURRENT_REGION=${CURRENT_REGION:-dc4}
CURRENT_GROUP=${CURRENT_GROUP:-reg-01jsnhvk699qd6aqyj359z2fpe}
CURRENT_PROJECT=${CURRENT_PROJECT:-pmp-01jye32jyp6p0efb9a18xr5gnf}
AUTH_TOKEN='eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ0Y2JZV3N3ZmJHVFQ4RWJKUDZNS0FPVjVPYl9BOFlydi13ZXk3bDFXYWVRIn0.eyJleHAiOjE3NjY2NTU4NDUsImlhdCI6MTc2NjYyNzA0NSwiYXV0aF90aW1lIjoxNzY2NjI3MDQ1LCJqdGkiOiIyZGI0YzQ1Yi03ZTI0LTQzZTItOTkzZi0wMWQwOWFjYTc2M2IiLCJpc3MiOiJodHRwczovL2ZvdW5kZXJpZC5pZHMuZnp5dW4uaW8vYXV0aC9yZWFsbXMvRm91bmRlcklEIiwiYXVkIjpbImx1YmFuLW1hc3RlciIsImFjY291bnQiXSwic3ViIjoiOWQ2ZGNiNTUtNzJjOS00YjBhLWE4NTgtMmE5MzJjMGE2NzFjIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibHViYW4tbWFzdGVyIiwic2Vzc2lvbl9zdGF0ZSI6ImI4NTI0M2JkLWVkYzctNDM2MC04ZGI5LWI1M2Y1ODAwMDJkOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJzaWQiOiJiODUyNDNiZC1lZGM3LTQzNjAtOGRiOS1iNTNmNTgwMDAyZDkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiLluobkuq4g6LS-IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiamlhcWwiLCJnaXZlbl9uYW1lIjoi5bqG5LquIiwibG9jYWxlIjoiemgtQ04iLCJmYW1pbHlfbmFtZSI6Iui0viIsImVtYWlsIjoiamlhcWxAZm91bmRlci5jb20uY24ifQ.a88iDFPpQzg7T1g-NSs3_UDzinvGASc2BDLexYA_n2pOC70plQog9_nJfTh6uhupmDg-cXIkg-z7Jwm3m_edmMsjl0bfH0GNaHeYqyG5CvcIBku5a9aB83aP3o92hYmx4P2yLDztBW6icJokGgmsC4NcK1NJaq8sEvajx1XCJkj9NEQhlfLGj1AB4Dg25xUx8D3fgH4l5slgTgwMgphG9C6fNbwfCFLj_PQlBykHL7yarLIDDBSYx374Gxyet6RN2M58eqiWO7GJIOQAl1rDWd8TMuB6N-ofwj9TqxOwXhNCQzVrLeW_RolEEmtC25ZNYJu40kWv-sXYhMph4ZCQeg'

if [[ -z "${CURRENT_ORG}" || -z "${CURRENT_REGION}" ]]; then
  echo "Missing CURRENT_ORG/CURRENT_REGION." >&2
  echo "Example:" >&2
  echo "  CURRENT_ORG=opo-xxxx CURRENT_REGION=dc4 ${0}" >&2
  exit 1
fi

if [[ -z "${AUTH_TOKEN}" ]]; then
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
fi

curl -sS \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Current-Org: ${CURRENT_ORG}" \
  -H "Current-Region: ${CURRENT_REGION}" \
  -H "Current-Group: ${CURRENT_GROUP}" \
  ${CURRENT_PROJECT:+-H "Current-Project: ${CURRENT_PROJECT}"} \
  "${BASE_URL}/${API_URL}"
