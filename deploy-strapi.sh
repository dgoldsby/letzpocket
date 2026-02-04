#!/bin/bash

# Strapi Deployment to Google Cloud Run
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_ID="letzpocket-site"
SERVICE_NAME="letzpocket-strapi"
REGION="europe-west2"
REPO_NAME="strapi-repo"

print_status "🚀 Starting Strapi deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install it first."
    exit 1
fi

# Set the project
print_status "Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required GCP APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository
print_status "Creating Artifact Registry repository..."
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Strapi Docker repository" || print_warning "Repository might already exist"

# Navigate to cms directory
cd cms

# Build and push Docker image
print_status "Building Docker image..."
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME"
docker buildx build --platform linux/amd64 -t $IMAGE_NAME --push .

# Generate secure secrets
APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)

# Deploy to Cloud Run
print_status "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_NAME \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300 \
    --concurrency=80 \
    --min-instances=0 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="HOST=0.0.0.0" \
    --set-env-vars="APP_KEYS=$APP_KEYS" \
    --set-env-vars="API_TOKEN_SALT=$API_TOKEN_SALT" \
    --set-env-vars="ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET" \
    --set-env-vars="JWT_SECRET=$JWT_SECRET" \
    --set-env-vars="TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format="value(status.url)")

print_success "🎉 Strapi deployed successfully!"
echo ""
echo "📋 Deployment Details:"
echo "  ✅ Service Name: $SERVICE_NAME"
echo "  ✅ Region: $REGION"
echo "  ✅ Project: $PROJECT_ID"
echo "  ✅ Image: $IMAGE_NAME"
echo ""
echo "🌐 Strapi Admin URL: $SERVICE_URL/admin"
echo "🔗 Strapi API URL: $SERVICE_URL/api"
echo ""
print_warning "⚠️  Important Notes:"
echo "  1. Update your React app's REACT_APP_STRAPI_URL to: $SERVICE_URL"
echo "  2. Set up database connection (see below)"
echo "  3. Configure environment variables in Cloud Run"
echo ""

# Database setup instructions
print_status "📊 Database Setup Instructions:"
echo "To complete the setup, you need to:"
echo ""
echo "1. Set up a PostgreSQL database:"
echo "   gcloud sql instances create letzpocket-db \\"
echo "     --database-version=POSTGRES_14 \\"
echo "     --region=$REGION \\"
echo "     --tier=db-f1-micro \\"
echo "     --storage-size=10GB"
echo ""
echo "2. Create database and user:"
echo "   gcloud sql databases create strapi --instance=letzpocket-db"
echo "   gcloud sql users create strapi --instance=letzpocket-db --password=YOUR_PASSWORD"
echo ""
echo "3. Update Cloud Run environment variables:"
echo "   gcloud run services update $SERVICE_NAME \\"
echo "     --region=$REGION \\"
echo "     --set-env-vars=\"DATABASE_CLIENT=postgres\" \\"
echo "     --set-env-vars=\"DATABASE_HOST=/cloudsql/letzpocket-site:europe-west2:letzpocket-db\" \\"
echo "     --set-env-vars=\"DATABASE_PORT=5432\" \\"
echo "     --set-env-vars=\"DATABASE_NAME=strapi\" \\"
echo "     --set-env-vars=\"DATABASE_USERNAME=strapi\" \\"
echo "     --set-env-vars=\"DATABASE_PASSWORD=YOUR_PASSWORD\" \\"
echo "     --set-env-vars=\"NODE_ENV=production\""
echo ""

print_success "🚀 Strapi is ready for production on Google Cloud!"
