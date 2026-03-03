#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the absolute path of the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR/.."

echo "🚀 Starting to build Coroot Docker image..."

# 1. Build the frontend first
echo "========================================"
echo "Step 1: Building frontend code"
echo "========================================"
bash "$SCRIPT_DIR/build_front_code.sh"

# 2. Build the backend code via Dockerfile
echo "========================================"
echo "Step 2: Building Docker image"
echo "========================================"
cd "$ROOT_DIR"

# You can pass additional arguments like VERSION if needed
# For now, we will build a default tag 'coroot:latest'
IMAGE_NAME="coroot:latest"

docker build -t "$IMAGE_NAME" .

echo "========================================"
echo "✅ Docker image '$IMAGE_NAME' has been successfully built!"
echo "========================================"
