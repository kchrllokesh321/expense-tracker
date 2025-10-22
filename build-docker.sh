#!/bin/bash

# Build and push Docker image script
# Usage: ./build-docker.sh [version]

set -e

# Configuration
DOCKER_USERNAME="lokesh86186"
IMAGE_NAME="react"
DEFAULT_VERSION="v1"

# Parse arguments
VERSION=${1:-$DEFAULT_VERSION}
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🐳 Building Docker Image"
echo "📦 Image: ${FULL_IMAGE_NAME}"
echo "=========================="

# Build the application first
echo "📝 Building React application..."
npm run build

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t "${IMAGE_NAME}:${VERSION}" .
docker tag "${IMAGE_NAME}:${VERSION}" "${FULL_IMAGE_NAME}"

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push "${FULL_IMAGE_NAME}"

echo "✅ Docker image built and pushed successfully!"
echo "📦 Full image name: ${FULL_IMAGE_NAME}"
echo "🏷️  Local tag: ${IMAGE_NAME}:${VERSION}"

echo ""
echo "To deploy this image, run:"
echo "./deploy.sh ${VERSION}"
