# LetzPocket Google Cloud Setup Guide

This guide will help you set up your Google Cloud project and configure all the necessary services for LetzPocket deployment.

## 🚀 Quick Setup Checklist

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Enter project name: `letz-pocket-prod`
4. Click "CREATE"

### 2. Enable Billing
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Select your project
3. Click "MANAGE BILLING ACCOUNTS"
4. Create or select a billing account
5. Enable billing for your project

### 3. Get Mailchimp API Keys
1. Log in to your Mailchimp account
2. Go to Account → Extras → API keys
3. Create a new API key
4. Note down:
   - **API Key**: `xxxxxxxxxxxxxxxxxxxxxx-us1`
   - **Server Prefix**: `us1` (the part after the last dash)
5. Go to Audience → All contacts → Settings
6. Note down your **Audience ID**

### 4. Get Firebase Configuration (Optional)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Select your Google Cloud project
4. Note down:
   - **API Key**: Project settings → General → Web API Key
   - **Auth Domain**: `your-project.firebaseapp.com`
   - **Project ID**: `your-project-id`
   - **Storage Bucket**: `your-project.appspot.com`
   - **Messaging Sender ID**: Project settings → Cloud Messaging
   - **App ID**: Project settings → General → App ID

## 🔧 Update Deployment Script

### 1. Edit deploy-gcp.sh
Open `deploy-gcp.sh` and update these variables:

```bash
# Configuration - UPDATE THESE VALUES
PROJECT_ID="letz-pocket-prod"  # ✅ Already set
REGION="europe-west2"           # ✅ Already set
SERVICE_NAME="letz-pocket"       # ✅ Already set
BUCKET_NAME="letz-pocket-website" # ✅ Already set

# Mailchimp Configuration - UPDATE THESE VALUES
MAILCHIMP_API_KEY="your_actual_mailchimp_api_key_here"
MAILCHIMP_SERVER_PREFIX="us1"  # Change if different
MAILCHIMP_LIST_ID="your_actual_audience_list_id_here"

# Firebase Configuration - UPDATE THESE VALUES
FIREBASE_API_KEY="your_actual_firebase_api_key_here"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="letz-pocket-prod"
FIREBASE_STORAGE_BUCKET="letz-pocket-prod.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
FIREBASE_APP_ID="your_app_id"
```

### 2. Install Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

### 3. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth application-default login
```

## 🚀 Deploy the Application

### 1. Run the Deployment Script
```bash
cd /path/to/letzpocket
./deploy-gcp.sh
```

### 2. Monitor the Deployment
The script will:
- ✅ Enable all required APIs
- ✅ Create App Engine application
- ✅ Set up Cloud Storage bucket
- ✅ Store API keys in Secret Manager
- ✅ Deploy the application
- ✅ Set up CDN (optional)

### 3. Verify Deployment
```bash
# Check application status
gcloud app describe

# View logs
gcloud app logs tail -s default

# Open in browser
gcloud app browse
```

## 🔐 Security Configuration

### 1. Environment Variables
The deployment script automatically:
- Stores API keys in Secret Manager
- Grants App Engine access to secrets
- Prevents sensitive data in code

### 2. SSL/HTTPS
- App Engine provides automatic SSL
- All traffic is encrypted by default
- Custom domains get free SSL certificates

### 3. IAM Permissions
- App Engine service account has minimum required permissions
- Secrets are only accessible to authorized services

## 📊 Cost Optimization

### 1. App Engine Pricing
- **F2 instance**: ~$0.05/hour
- **1 instance minimum**: ~$36/month
- **10 instances max**: ~$360/month at peak

### 2. Additional Costs
- **Cloud Storage**: ~$0.026/GB/month
- **Secret Manager**: ~$0.03/month per secret
- **Data Egress**: First 1GB/day free
- **App Engine Operations**: Free tier covers most usage

### 3. Cost Saving Tips
- Set appropriate min/max instances
- Monitor usage in Google Cloud Console
- Use Cloud Storage for static assets
- Consider Cloud Run for variable workloads

## 🌐 Custom Domain Setup

### 1. Verify Domain
1. Go to App Engine → Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

### 2. SSL Certificate
- Automatic SSL provisioning
- Free for all App Engine apps
- Auto-renewal included

## 📈 Monitoring and Logging

### 1. Application Monitoring
```bash
# Real-time logs
gcloud app logs tail -s default

# Error logs only
gcloud app logs tail -s default --filter="ERROR"

# Recent logs
gcloud app logs read -s default --limit=50
```

### 2. Performance Monitoring
- Go to App Engine → Monitoring
- Set up alerting policies
- Monitor instance scaling
- Track error rates

### 3. Cost Monitoring
- Go to Billing → Budgets & alerts
- Set spending alerts
- Monitor resource usage

## 🔄 CI/CD Integration

### 1. Cloud Build Triggers
1. Go to Cloud Build → Triggers
2. Connect your GitHub repository
3. Set up automatic deployment on push

### 2. GitHub Actions Alternative
```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Cloud
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
      - run: |
        gcloud auth login --key-file=${{ secrets.GCP_SA_KEY }}
        gcloud app deploy
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds list --limit=5
   gcloud builds log <BUILD_ID>
   ```

2. **API Key Issues**
   - Verify Mailchimp API key format
   - Check Secret Manager permissions
   - Test API access manually

3. **Deployment Failures**
   ```bash
   # Check App Engine status
   gcloud app describe
   
   # Check service configuration
   gcloud app describe
   ```

4. **Environment Variable Issues**
   - Verify Secret Manager secrets
   - Check IAM permissions
   - Test with local environment variables

### Debug Commands
```bash
# Check project configuration
gcloud config list

# Verify API status
gcloud services list --enabled

# Test API access
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://appengine.googleapis.com/v1/apps/your-project-id
```

## 🎉 Success!

Once deployed, your LetzPocket application will be available at:
- **Primary**: `https://letz-pocket-prod.appspot.com`
- **Custom**: Your configured domain (if set up)

### Features Available:
✅ Marketing landing page with lead capture  
✅ Mailchimp integration for email marketing  
✅ Free tenancy agreement review  
✅ Authentication system  
✅ Property management tools  
✅ Email workflow automation  
✅ Your LetzPocket branding  

### Next Steps:
1. Test all functionality
2. Monitor performance
3. Set up custom domain (optional)
4. Configure analytics (optional)
5. Set up monitoring alerts
