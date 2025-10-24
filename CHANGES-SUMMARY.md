# Changes Summary: Minikube + Simple Docker Naming

## 🎯 Key Changes Made

### 1. **Combined Kubernetes Manifest**
- **Created**: `k8s-manifest.yaml` - Single file containing Secret, Deployment, and Service
- **Benefits**: Easier management, single file deployment
- **Features**: 
  - Resource limits (128Mi-256Mi memory, 100m-200m CPU)
  - Fixed NodePort (30080) for consistent access
  - Optimized for minikube environment

### 2. **Simplified Docker Image Naming**
- **Before**: `lokesh86186/react:latest`
- **After**: `react:v1` (with full name `lokesh86186/react:v1` on Docker Hub)
- **Benefits**: Cleaner naming, version-focused approach

### 3. **Enhanced GitHub Actions Workflow**
- Updated image naming strategy
- Combined manifest deployment
- Minikube service URL detection
- Simplified tag management

### 4. **New Helper Scripts**

#### `build-docker.sh`
```bash
# Build and push Docker image with version
./build-docker.sh v2
```

#### `minikube-helpers.sh`
```bash
./minikube-helpers.sh apply    # Deploy to minikube
./minikube-helpers.sh url      # Get service URL
./minikube-helpers.sh status   # Check deployment status
./minikube-helpers.sh logs     # View pod logs
./minikube-helpers.sh restart  # Restart deployment
./minikube-helpers.sh delete   # Clean up resources
```

### 5. **Updated Existing Scripts**
- `deploy.sh`: Uses combined manifest, minikube URL support
- `health-check.sh`: Includes minikube service URL detection

## 🚀 Quick Start

### For GitHub Actions (Automatic)
1. Configure secrets: `DOCKER_PASSWORD` and `SSH_PRIVATE_KEY`
2. Push to main/master branch
3. Access via: `http://45.129.86.68:30080`

### For Local Minikube Development
```bash
# Build and push image
./build-docker.sh v1

# Deploy to minikube
./minikube-helpers.sh apply

# Get service URL
./minikube-helpers.sh url

# Check everything is working
./minikube-helpers.sh status
```

### For Manual Server Deployment
```bash
# Deploy to your server
./deploy.sh v1 45.129.86.68

# Check deployment health
./health-check.sh 45.129.86.68
```

## 🔧 File Structure
```
├── k8s-manifest.yaml          # Combined K8s manifest
├── build-docker.sh            # Build & push Docker image
├── deploy.sh                  # Manual deployment
├── health-check.sh            # Health check script
├── minikube-helpers.sh        # Minikube utilities
└── .github/workflows/
    └── build-and-deploy.yml   # Updated CI/CD pipeline
```

## 🌐 Access Points

### Minikube
```bash
# Get dynamic URL
minikube service expense-app-service --url
```

### Standard Kubernetes
- **URL**: `http://45.129.86.68:30080`
- **Port**: `30080` (Fixed NodePort)

## 📦 Docker Images

All images are pushed to Docker Hub as:
- `lokesh86186/react:v1` (main/master)
- `lokesh86186/react:v<commit-sha>` (branches)
- Local tag: `react:v1`

## ✅ Benefits of Changes

1. **Simpler Management**: One manifest file instead of three
2. **Minikube Optimized**: Built-in minikube support and helpers
3. **Cleaner Naming**: Simple, version-focused Docker tags
4. **Better DevEx**: Multiple helper scripts for different workflows
5. **Fixed Port**: Consistent access via port 30080
6. **Resource Limits**: Prevents resource exhaustion
7. **Enhanced Monitoring**: Better status and URL detection
