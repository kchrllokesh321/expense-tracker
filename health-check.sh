#!/bin/bash

# Health check script for the deployed application
# Usage: ./health-check.sh [server-ip]

DEFAULT_SERVER="45.129.86.68"
SERVER_IP=${1:-$DEFAULT_SERVER}

echo "🏥 Health Check for Expense App"
echo "🎯 Server: ${SERVER_IP}"
echo "=========================="

echo "📊 Checking Kubernetes resources..."
ssh -o StrictHostKeyChecking=no root@${SERVER_IP} << 'EOF'
    echo "=== Namespace: default ==="
    
    echo "📦 Pods:"
    kubectl get pods -l app=expense-app -o wide
    echo ""
    
    echo "🔄 Deployment:"
    kubectl get deployment expense-app-deployment
    echo ""
    
    echo "🌐 Service:"
    kubectl get service expense-app-service
    echo ""
    
    echo "📋 Recent Events:"
    kubectl get events --field-selector involvedObject.name=expense-app-deployment --sort-by='.lastTimestamp' | tail -5
    echo ""
    
    echo "🔍 Pod Logs (last 10 lines):"
    POD_NAME=$(kubectl get pods -l app=expense-app -o jsonpath='{.items[0].metadata.name}')
    if [ ! -z "$POD_NAME" ]; then
        kubectl logs $POD_NAME --tail=10
    else
        echo "No pods found"
    fi
    echo ""
    
    echo "💻 Service Details:"
    kubectl describe service expense-app-service | grep -E "(Port|NodePort|Endpoints)"
    echo ""
    
    echo "🌐 Minikube Service URL (if available):"
    if command -v minikube &> /dev/null; then
        minikube service expense-app-service --url 2>/dev/null || echo "Minikube not available or service not ready"
    else
        echo "Minikube not installed"
    fi
EOF

echo "✅ Health check completed!"
