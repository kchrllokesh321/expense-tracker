#!/bin/bash

# Minikube helper commands for the expense app
# Usage: ./minikube-helpers.sh [command]

set -e

DEPLOYMENT_NAME="expense-app-deployment"
SERVICE_NAME="expense-app-service"

show_help() {
    echo "Minikube Helper Commands for Expense App"
    echo "========================================"
    echo ""
    echo "Usage: ./minikube-helpers.sh [command]"
    echo ""
    echo "Commands:"
    echo "  url      - Get the service URL"
    echo "  status   - Show deployment and service status"
    echo "  logs     - Show pod logs"
    echo "  restart  - Restart the deployment"
    echo "  delete   - Delete all resources"
    echo "  apply    - Apply the k8s-manifest.yaml"
    echo "  help     - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./minikube-helpers.sh url"
    echo "  ./minikube-helpers.sh status"
    echo "  ./minikube-helpers.sh logs"
}

get_url() {
    echo "🌐 Getting service URL..."
    minikube service $SERVICE_NAME --url
}

show_status() {
    echo "📊 Deployment Status:"
    kubectl get deployment $DEPLOYMENT_NAME
    echo ""
    echo "📦 Pods:"
    kubectl get pods -l app=expense-app
    echo ""
    echo "🌐 Service:"
    kubectl get service $SERVICE_NAME
    echo ""
    echo "🔗 Service URL:"
    minikube service $SERVICE_NAME --url 2>/dev/null || echo "Service not ready"
}

show_logs() {
    echo "📋 Pod Logs:"
    POD_NAME=$(kubectl get pods -l app=expense-app -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ ! -z "$POD_NAME" ]; then
        kubectl logs $POD_NAME --tail=50
    else
        echo "No pods found"
    fi
}

restart_deployment() {
    echo "🔄 Restarting deployment..."
    kubectl rollout restart deployment/$DEPLOYMENT_NAME
    kubectl rollout status deployment/$DEPLOYMENT_NAME
    echo "✅ Deployment restarted successfully!"
}

delete_resources() {
    echo "🗑️  Deleting all resources..."
    kubectl delete -f k8s-manifest.yaml 2>/dev/null || echo "Resources may not exist"
    echo "✅ Resources deleted!"
}

apply_manifest() {
    echo "📋 Applying k8s-manifest.yaml..."
    kubectl apply -f k8s-manifest.yaml
    echo "⏳ Waiting for deployment..."
    kubectl rollout status deployment/$DEPLOYMENT_NAME
    echo "✅ Manifest applied successfully!"
    echo ""
    echo "🔗 Service URL:"
    minikube service $SERVICE_NAME --url
}

# Main command processing
case "$1" in
    "url")
        get_url
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        restart_deployment
        ;;
    "delete")
        delete_resources
        ;;
    "apply")
        apply_manifest
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
