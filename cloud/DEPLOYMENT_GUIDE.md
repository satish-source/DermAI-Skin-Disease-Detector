# DermAI Cloud Deployment Guide (AWS & Azure)

This guide provides turnkey instructions for deploying the containerized DermAI platform to AWS and Microsoft Azure cloud infrastructure.

---

## 1. Deploying to AWS (Amazon Web Services)

### Option A: AWS App Runner (Easiest & Fastest Serverless Container)

1. **Build and push images to Amazon ECR (Elastic Container Registry)**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

   # Build and push backend
   docker build -t dermai-backend -f Dockerfile.backend .
   docker tag dermai-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/dermai-backend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/dermai-backend:latest

   # Build and push frontend
   docker build -t dermai-frontend -f Dockerfile.frontend .
   docker tag dermai-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/dermai-frontend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/dermai-frontend:latest
   ```

2. **Deploy via AWS App Runner**:
   - Go to AWS Console -> App Runner -> Create Service.
   - Choose Container Registry -> Amazon ECR -> Select `dermai-backend` (Port 8000) and `dermai-frontend` (Port 80).
   - Click Deploy. App Runner automatically provisions SSL, auto-scaling, and load balancing.

### Option B: AWS ECS Fargate
Register the task definition provided in `cloud/aws-task-definition.json`:
```bash
aws ecs register-task-definition --cli-input-json file://cloud/aws-task-definition.json
aws ecs create-service --cluster dermai-cluster --service-name dermai-svc --task-definition dermai-task --desired-count 1 --launch-type FARGATE
```

---

## 2. Deploying to Microsoft Azure

### Option A: Azure Container Apps (Recommended)

1. **Log in to Azure and create resource group**:
   ```bash
   az login
   az group create --name dermai-rg --location eastus
   az acr create --resource-group dermai-rg --name dermaicr --sku Basic --admin-enabled true
   ```

2. **Build and push images to Azure Container Registry (ACR)**:
   ```bash
   az acr build --registry dermaicr --image dermai-backend:latest -f Dockerfile.backend .
   az acr build --registry dermaicr --image dermai-frontend:latest -f Dockerfile.frontend .
   ```

3. **Deploy with Azure Container Apps CLI**:
   ```bash
   az containerapp env create --name dermai-env --resource-group dermai-rg --location eastus
   az containerapp create \
     --name dermai-app \
     --resource-group dermai-rg \
     --environment dermai-env \
     --image dermaicr.azurecr.io/dermai-frontend:latest \
     --target-port 80 \
     --ingress external \
     --query properties.configuration.ingress.fqdn
   ```

---

## 3. Local Cloud Emulation with Docker Compose

To run the entire cloud container topology locally:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`

