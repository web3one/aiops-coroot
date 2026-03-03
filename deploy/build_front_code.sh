#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get the absolute path of the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONT_DIR="$SCRIPT_DIR/../front"

echo "🚀 Navigating to frontend directory ($FRONT_DIR)..."
cd "$FRONT_DIR"

echo "📦 Installing npm dependencies..."
npm ci

echo "🔨 Building frontend resources for production..."
npm run build-prod

echo "✅ Frontend build complete! The static files have been generated in the ../static directory."
