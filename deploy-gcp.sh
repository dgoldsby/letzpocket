#!/bin/bash

# LetzPocket Google Cloud Deployment Script
# This script deploys the LetzPocket application to Google Cloud Platform

set -e

# Configuration
PROJECT_ID="your-project-id"
REGION="europe-west2"
SERVICE_NAME="letz-pocket"
BUCKET_NAME="letz-pocket-website"

echo "🚀 Starting LetzPocket deployment to Google Cloud Platform..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK (gcloud) is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please login to Google Cloud:"
    gcloud auth login
fi

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com

# Create App Engine app if it doesn't exist
echo "🏗️  Setting up App Engine..."
if ! gcloud app describe --region=$REGION &> /dev/null; then
    gcloud app create --region=$REGION
fi

# Create Cloud Storage bucket if it doesn't exist
echo "📦 Setting up Cloud Storage bucket..."
if ! gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
    gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
fi

# Deploy to App Engine
echo "🚀 Deploying to App Engine..."
gcloud app deploy --quiet

# Build and deploy static assets to Cloud Storage
echo "📦 Building and deploying static assets..."
npm run build

# Upload to Cloud Storage
echo "📤 Uploading to Cloud Storage..."
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME/

# Make files public
echo "🌐 Setting public access..."
gsutil -m acl ch -R public-read gs://$BUCKET_NAME/**

# Get the App Engine URL
APP_URL=$(gcloud app describe --format="value(defaultHostname)")
BUCKET_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   App Engine: https://$APP_URL"
echo "   Cloud Storage: $BUCKET_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure your environment variables in App Engine"
echo "   2. Set up your Mailchimp API keys"
echo "   3. Configure your custom domain if needed"
echo ""
echo "📊 Monitor your deployment:"
echo "   gcloud app logs tail -s default"
echo "   gcloud app browse"
echo ""
echo "🎯 Your LetzPocket application is now live!"
