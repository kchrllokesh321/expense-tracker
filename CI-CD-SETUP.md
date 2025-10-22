# CI/CD Setup Guide

This repository includes a GitHub Actions workflow that automatically builds Docker images and deploys to your Kubernetes cluster.

## 🔧 Setup Requirements

### 1. GitHub Repository Secrets

You need to configure the following secrets in your GitHub repository (`Settings` > `Secrets and variables` > `Actions`):

#### Required Secrets:

1. **DOCKER_PASSWORD**
   - Your Docker Hub access token or password
   - Used to push images to Docker Hub

2. **SSH_PRIVATE_KEY**
   - Private SSH key for accessing your server (45.129.86.68)
   - The corresponding public key should be added to the server's `~/.ssh/authorized_keys`

### 2. Server Setup (45.129.86.68)

Your Kubernetes server should have:

1. **kubectl** installed and configured
2. **SSH access** for the GitHub Actions runner
3. **Docker Hub secret** applied to Kubernetes cluster

#### Apply the Docker Hub secret to your cluster:
```bash
kubectl apply -f kube-secret.yaml
```

## 🚀 Workflow Overview

The GitHub Actions workflow (`build-and-deploy.yml`) performs the following steps:

### Build Job:
1. **Checkout code** from the repository
2. **Setup Node.js** environment (version 20)
3. **Install dependencies** using npm
4. **Build the React application** (`npm run build`)
5. **Setup Docker Buildx** for advanced Docker builds
6. **Login to Docker Hub** using provided credentials
7. **Build and push Docker image** with simple naming (`react:v1`)

### Deploy Job (only on main/master branch):
1. **Setup kubectl** for Kubernetes operations
2. **Setup SSH connection** to your server
3. **Update k8s-manifest.yaml** with the new Docker image tag
4. **Deploy to Kubernetes** via SSH:
   - Apply combined manifest (secrets, deployment, and service)
   - Wait for deployment rollout to complete
   - Display deployment status and minikube service URL

## 🏷️ Docker Image Tagging Strategy

The workflow uses simple image naming:
- `react:v1` (for main/master branch)
- `react:main-v<commit-sha>` or `react:master-v<commit-sha>`
- Branch name for feature branches
- PR number for pull requests

## 🔄 Deployment Process

1. **Automatic Deployment**: Triggers on push to main/master branch
2. **Manual Deployment**: Can be triggered via GitHub Actions UI (`workflow_dispatch`)
3. **Pull Request**: Only builds and pushes Docker image (no deployment)

## 📁 Kubernetes Manifests

- `k8s-manifest.yaml`: Combined manifest containing:
  - Secret: Docker Hub credentials for image pulling
  - Deployment: Application deployment configuration with resource limits
  - Service: NodePort service (port 30080) for external access

## 🛠️ Local Development

### Build and Test Docker Image
```bash
# Build and push Docker image (automated)
./build-docker.sh v1

# Or manually:
npm run build
docker build -t react:v1 .
docker tag react:v1 lokesh86186/react:v1
docker push lokesh86186/react:v1

# Run locally
docker run -p 8080:80 react:v1
```

### Minikube Commands
```bash
# Apply manifest to minikube
./minikube-helpers.sh apply

# Get service URL
./minikube-helpers.sh url

# Check status
./minikube-helpers.sh status

# View logs
./minikube-helpers.sh logs
```

## 🐛 Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Verify SSH_PRIVATE_KEY secret is correct
   - Ensure public key is added to server's authorized_keys
   - Check server firewall settings

2. **Docker Push Failed**
   - Verify DOCKER_PASSWORD secret is correct
   - Check Docker Hub account permissions

3. **Kubernetes Deployment Failed**
   - Verify kubectl is installed on the server
   - Check if kube-secret.yaml is applied
   - Verify Docker image is accessible from the cluster

### Logs and Monitoring:

Check deployment status on your server:
```bash
# Using helper script
./health-check.sh

# Or manually:
kubectl get pods -l app=expense-app
kubectl logs -l app=expense-app
kubectl describe deployment expense-app-deployment

# For minikube:
./minikube-helpers.sh status
```

## 🔒 Security Notes

1. Keep your secrets secure and rotate them regularly
2. Use minimal permissions for the SSH key
3. Consider using a dedicated deployment user instead of root
4. Regularly update your Docker base images for security patches

## 🎯 Access Your Application

After successful deployment, your application will be accessible via:

### Minikube:
```bash
# Get the service URL
./minikube-helpers.sh url
# or
minikube service expense-app-service --url
```

### Standard Kubernetes:
- Server IP: `45.129.86.68`
- Port: `30080` (NodePort)
- URL: `http://45.129.86.68:30080`
