#!/bin/bash

# LetzPocket Google Cloud Deployment Script
# This script deploys the LetzPocket application to Google Cloud Platform

set -e

# Configuration - UPDATE THESE VALUES
PROJECT_ID="letzpocket-site"  # Your existing project ID
REGION="europe-west2"
SERVICE_NAME="letz-pocket"
BUCKET_NAME="letz-pocket-website"

# Mailchimp Configuration - UPDATE THESE VALUES
MAILCHIMP_API_KEY="ca0df8a8db2d8f45d767bd2b7badef7a"
MAILCHIMP_SERVER_PREFIX="us6"  # e.g., us1, us2, etc.
MAILCHIMP_LIST_ID="WEBSITE"

# Firebase Configuration - UPDATE THESE VALUES
FIREBASE_API_KEY="AIzaSyBiANBFBL0K4v36ZSYD_wS7uGdRsQIbC-A"
FIREBASE_AUTH_DOMAIN="letzpocket-site.firebaseapp.com"
FIREBASE_PROJECT_ID="letzpocket-site"
FIREBASE_STORAGE_BUCKET="letzpocket-site.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="557937099852"
FIREBASE_APP_ID="1:557937099852:web:b3dfab6dac35efb51ae0e9"

echo "🚀 Starting LetzPocket deployment to Google Cloud Platform..."
echo "📋 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🔧 Service: $SERVICE_NAME"

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
    echo "📧 Please also set up application default credentials:"
    gcloud auth application-default login
fi

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable appengine.googleapis.com --project=$PROJECT_ID
gcloud services enable storage.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable firebase.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Create App Engine app if it doesn't exist
echo "🏗️  Setting up App Engine..."
if ! gcloud app describe --region=$REGION --project=$PROJECT_ID &> /dev/null; then
    echo "Creating App Engine application..."
    gcloud app create --region=$REGION --project=$PROJECT_ID
fi

# Create Cloud Storage bucket if it doesn't exist
echo "📦 Setting up Cloud Storage bucket..."
if ! gsutil ls -b gs://$BUCKET_NAME --project=$PROJECT_ID &> /dev/null; then
    echo "Creating Cloud Storage bucket..."
    gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
fi

# Store sensitive data in Secret Manager
echo "🔐 Setting up secrets in Secret Manager..."

# Mailchimp API Key
if gcloud secrets describe mailchimp-api-key --project=$PROJECT_ID &> /dev/null; then
    echo "Updating Mailchimp API key secret..."
    echo -n "$MAILCHIMP_API_KEY" | gcloud secrets versions add mailchimp-api-key --data-file=- --project=$PROJECT_ID
else
    echo "Creating Mailchimp API key secret..."
    echo -n "$MAILCHIMP_API_KEY" | gcloud secrets create mailchimp-api-key --data-file=- --project=$PROJECT_ID
fi

# Mailchimp Server Prefix
if gcloud secrets describe mailchimp-server-prefix --project=$PROJECT_ID &> /dev/null; then
    echo "Updating Mailchimp server prefix secret..."
    echo -n "$MAILCHIMP_SERVER_PREFIX" | gcloud secrets versions add mailchimp-server-prefix --data-file=- --project=$PROJECT_ID
else
    echo "Creating Mailchimp server prefix secret..."
    echo -n "$MAILCHIMP_SERVER_PREFIX" | gcloud secrets create mailchimp-server-prefix --data-file=- --project=$PROJECT_ID
fi

# Mailchimp List ID
if gcloud secrets describe mailchimp-list-id --project=$PROJECT_ID &> /dev/null; then
    echo "Updating Mailchimp list ID secret..."
    echo -n "$MAILCHIMP_LIST_ID" | gcloud secrets versions add mailchimp-list-id --data-file=- --project=$PROJECT_ID
else
    echo "Creating Mailchimp list ID secret..."
    echo -n "$MAILCHIMP_LIST_ID" | gcloud secrets create mailchimp-list-id --data-file=- --project=$PROJECT_ID
fi

# Firebase API Key
if gcloud secrets describe firebase-api-key --project=$PROJECT_ID &> /dev/null; then
    echo "Updating Firebase API key secret..."
    echo -n "$FIREBASE_API_KEY" | gcloud secrets versions add firebase-api-key --data-file=- --project=$PROJECT_ID
else
    echo "Creating Firebase API key secret..."
    echo -n "$FIREBASE_API_KEY" | gcloud secrets create firebase-api-key --data-file=- --project=$PROJECT_ID
fi

# Grant App Engine access to secrets
echo "🔑 Granting App Engine access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding mailchimp-api-key --member="serviceAccount:$PROJECT_NUMBER@appspot.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID
gcloud secrets add-iam-policy-binding mailchimp-server-prefix --member="serviceAccount:$PROJECT_NUMBER@appspot.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID
gcloud secrets add-iam-policy-binding mailchimp-list-id --member="serviceAccount:$PROJECT_NUMBER@appspot.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID
gcloud secrets add-iam-policy-binding firebase-api-key --member="serviceAccount:$PROJECT_NUMBER@appspot.gserviceaccount.com" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID

# Deploy to App Engine
echo "🚀 Deploying to App Engine..."
gcloud app deploy --quiet --project=$PROJECT_ID

# Build and deploy static assets to Cloud Storage
echo "📦 Building and deploying static assets..."
npm run build

# Upload to Cloud Storage
echo "📤 Uploading to Cloud Storage..."
gsutil -m rsync -r -d build/ gs://$BUCKET_NAME/

# Make files public
echo "🌐 Setting public access..."
gsutil -m acl ch -R public-read gs://$BUCKET_NAME/**

# Set up Cloud CDN (optional)
echo "🌐 Setting up Cloud CDN..."
if ! gcloud compute url-maps describe letz-pocket-cdn --project=$PROJECT_ID &> /dev/null; then
    echo "Creating CDN..."
    gcloud compute url-maps create letz-pocket-cdn --default-service_BUCKET=gs://$BUCKET_NAME --project=$PROJECT_ID
    gcloud compute target-http-proxies create letz-pocket-http-proxy --url-map=letz-pocket-cdn --project=$PROJECT_ID
    gcloud compute forwarding-rules create letz-pocket-http-rule --address=0.0.0.0 --target-http-proxy=letz-pocket-http-proxy --port-range=80 --project=$PROJECT_ID
fi

# Get the App Engine URL
APP_URL=$(gcloud app describe --format="value(defaultHostname)" --project=$PROJECT_ID)
BUCKET_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   App Engine: https://$APP_URL"
echo "   Cloud Storage: $BUCKET_URL"
echo ""
echo "� Secrets created in Secret Manager:"
echo "   - mailchimp-api-key"
echo "   - mailchimp-server-prefix"
echo "   - mailchimp-list-id"
echo "   - firebase-api-key"
echo ""
echo "�� Next steps:"
echo "   1. Update your environment variables in the App Engine console"
echo "   2. Test the application functionality"
echo "   3. Configure your custom domain if needed"
echo "   4. Set up monitoring and alerts"
echo ""
echo "📊 Monitor your deployment:"
echo "   gcloud app logs tail -s default --project=$PROJECT_ID"
echo "   gcloud app browse --project=$PROJECT_ID"
echo ""
echo "🎯 Your LetzPocket application is now live!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Make sure to update the configuration variables at the top of this script"
echo "   - Test all functionality including Mailchimp integration"
echo "   - Monitor costs in Google Cloud Console"
