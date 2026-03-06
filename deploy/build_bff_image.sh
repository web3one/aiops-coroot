#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BFF_DIR="$ROOT_DIR/front-bff"
ENV_FILE="$BFF_DIR/.env"
IMAGE_NAME="${IMAGE_NAME:-push.fzyun.io/founder/aiops.front-bff}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
DOCKER_BUILD_NETWORK="${DOCKER_BUILD_NETWORK:-host}"

if [[ -z "${DATABASE_URL:-}" && -f "$ENV_FILE" ]]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2-)"
fi

if [[ "${DATABASE_URL:-}" == \"*\" ]]; then
    DATABASE_URL="${DATABASE_URL#\"}"
    DATABASE_URL="${DATABASE_URL%\"}"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL is not set."
    echo "Set DATABASE_URL in the shell or in $ENV_FILE before building."
    exit 1
fi

echo "Starting to build BFF Docker image..."
echo "Step 1: Building Docker image"

cd "$ROOT_DIR"

docker build \
    --network "$DOCKER_BUILD_NETWORK" \
    --build-arg DATABASE_URL="$DATABASE_URL" \
    --build-arg NPM_REGISTRY="$NPM_REGISTRY" \
    -f "$BFF_DIR/Dockerfile" \
    -t "$IMAGE_NAME" \
    "$BFF_DIR"

echo "Step 2: Pushing Docker image"
docker push "$IMAGE_NAME"

echo "Docker image '$IMAGE_NAME' has been successfully built and pushed."
