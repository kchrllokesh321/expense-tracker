#!/bin/bash

# Manual deployment script for the expense app
# Usage: ./deploy.sh [image-tag] [server-ip]

set -e

# Configuration
DOCKER_USERNAME="lokesh86186"
IMAGE_NAME="lokesh86186/react"
DEFAULT_SERVER="45.129.86.68"
DEFAULT_TAG="latest"

# Parse arguments
IMAGE_TAG=${1:-$DEFAULT_TAG}
SERVER_IP=${2:-$DEFAULT_SERVER}

echo "🚀 Deploying Expense App"
echo "📦 Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "🎯 Server: ${SERVER_IP}"
echo "=========================="

# Update deployment.yaml with the specified image tag
echo "📝 Updating deployment.yaml..."
sed -i.bak "s|image:.*|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" deployment.yaml

# Copy files to server and apply
echo "📤 Copying manifests to server..."
scp -o StrictHostKeyChecking=no kube-secret.yaml deployment.yaml service.yaml root@${SERVER_IP}:/tmp/

echo "🔄 Applying Kubernetes manifests..."
ssh -o StrictHostKeyChecking=no root@${SERVER_IP} << EOF
    echo "Applying Kubernetes manifests..."
    kubectl apply -f /tmp/kube-secret.yaml
    kubectl apply -f /tmp/deployment.yaml
    kubectl apply -f /tmp/service.yaml
    
    echo "Waiting for deployment to be ready..."
    kubectl rollout status deployment/expense-app-deployment --timeout=300s
    
    echo "Current status:"
    kubectl get pods -l app=expense-app
    kubectl get services expense-app-service
    
    # Cleanup
    rm -f /tmp/kube-secret.yaml /tmp/deployment.yaml /tmp/service.yaml
EOF

# Restore original deployment.yaml
echo "🔄 Restoring original deployment.yaml..."
mv deployment.yaml.bak deployment.yaml

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be accessible via the NodePort service"

# Show how to check service endpoint
echo ""
echo "To check the service endpoint, run:"
echo "ssh root@${SERVER_IP} 'kubectl get svc expense-app-service'"
