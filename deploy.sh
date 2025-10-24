#!/bin/bash

# Manual deployment script for the expense app
# Usage: ./deploy.sh [image-tag] [server-ip]

set -e

# Configuration
DOCKER_USERNAME="lokesh86186"
IMAGE_NAME="react"
DEFAULT_SERVER="45.129.86.68"
DEFAULT_TAG="v1"

# Parse arguments
IMAGE_TAG=${1:-$DEFAULT_TAG}
SERVER_IP=${2:-$DEFAULT_SERVER}

echo "🚀 Deploying Expense App"
echo "📦 Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "🎯 Server: ${SERVER_IP}"
echo "=========================="

# Update k8s-manifest.yaml with the specified image tag
echo "📝 Updating k8s-manifest.yaml..."
sed -i.bak "s|image: react:.*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" k8s-manifest.yaml

# Copy manifest to server and apply
echo "📤 Copying manifest to server..."
scp -o StrictHostKeyChecking=no k8s-manifest.yaml root@${SERVER_IP}:/tmp/

echo "🔄 Applying Kubernetes manifest..."
ssh -o StrictHostKeyChecking=no root@${SERVER_IP} << EOF
    echo "Applying combined Kubernetes manifest..."
    kubectl apply -f /tmp/k8s-manifest.yaml
    
    echo "Waiting for deployment to be ready..."
    kubectl rollout status deployment/expense-app-deployment --timeout=300s
    
    echo "Current status:"
    kubectl get pods -l app=expense-app
    kubectl get services expense-app-service
    
    # Show minikube service URL if available
    if command -v minikube &> /dev/null; then
        echo "Minikube service URL:"
        minikube service expense-app-service --url
    fi
    
    # Cleanup
    rm -f /tmp/k8s-manifest.yaml
EOF

# Restore original k8s-manifest.yaml
echo "🔄 Restoring original k8s-manifest.yaml..."
mv k8s-manifest.yaml.bak k8s-manifest.yaml

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be accessible via the NodePort service"

# Show how to check service endpoint
echo ""
echo "To check the service endpoint, run:"
echo "ssh root@${SERVER_IP} 'kubectl get svc expense-app-service'"
echo ""
echo "For minikube, get the service URL with:"
echo "ssh root@${SERVER_IP} 'minikube service expense-app-service --url'"
