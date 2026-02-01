# LetzPocket Google Cloud Deployment Guide

This guide will help you deploy the LetzPocket application to Google Cloud Platform.

## 🚀 Quick Start

### Prerequisites
1. **Google Cloud SDK** installed
2. **Google Cloud account** with billing enabled
3. **Node.js 18+** installed locally

### Step 1: Configure Google Cloud

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

### Step 2: Deploy the Application

```bash
# Navigate to the project directory
cd letzpocket

# Run the deployment script
./deploy-gcp.sh
```

## 📋 Manual Deployment Steps

### 1. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com
```

### 2. Create App Engine Application
```bash
gcloud app create --region=europe-west2
```

### 3. Deploy to App Engine
```bash
gcloud app deploy
```

### 4. Deploy Static Assets (Optional)
```bash
# Build the application
npm run build

# Create Cloud Storage bucket
gsutil mb gs://your-bucket-name

# Upload static files
gsutil -m rsync -r -d build/ gs://your-bucket-name/

# Make files public
gsutil -m acl ch -R public-read gs://your-bucket-name/**
```

## 🔧 Configuration

### Environment Variables
Set these in the Google Cloud Console or using `gcloud`:

```bash
# App Engine environment variables
gcloud app deploy --set-env-vars=NODE_ENV=production
gcloud app deploy --set-env-vars=REACT_APP_MAILCHIMP_API_KEY=your_key
gcloud app deploy --set-env-vars=REACT_APP_MAILCHIMP_SERVER_PREFIX=us1
gcloud app deploy --set-env-vars=REACT_APP_MAILCHIMP_LIST_ID=your_list_id
```

### Custom Domain
1. Verify your domain in Google Cloud Console
2. Update DNS records
3. Map custom domain to App Engine

## 📊 Monitoring

### View Logs
```bash
# View application logs
gcloud app logs tail -s default

# View specific error logs
gcloud app logs tail -s default --filter="ERROR"
```

### Monitor Performance
```bash
# Open application in browser
gcloud app browse

# View application details
gcloud app describe
```

## 🎯 Deployment Options

### Option 1: App Engine (Recommended)
- **Pros**: Fully managed, auto-scaling, SSL included
- **Cons**: Limited to Node.js runtime constraints
- **Best for**: Production applications

### Option 2: Cloud Run
- **Pros**: Container-based, more flexibility
- **Cons**: Requires Docker setup
- **Best for**: Custom runtime requirements

### Option 3: Cloud Storage + CDN
- **Pros**: Static hosting, very fast
- **Cons**: No server-side functionality
- **Best for**: Static sites only

## 🔐 Security

### SSL/TLS
- App Engine provides automatic SSL
- Custom domains get free SSL certificates
- All traffic is encrypted by default

### Environment Variables
- Store sensitive data in Secret Manager
- Use encrypted environment variables
- Never commit API keys to Git

## 📈 Scaling

### App Engine Scaling
```yaml
# In app.yaml
automatic_scaling:
  min_instances: 1
  max_instances: 10
  cpu_utilization:
    target_utilization: 0.65
```

### Cost Optimization
- Use minimum instances for low traffic
- Set appropriate memory limits
- Monitor usage and adjust accordingly

## 🔄 CI/CD Integration

### Cloud Build Integration
```yaml
# cloudbuild.yaml is already configured
# Connect your GitHub repository to Cloud Build
# Set up triggers for automatic deployment
```

### GitHub Actions (Alternative)
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
      - run: gcloud app deploy
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs for specific errors

2. **Deployment Failures**
   - Ensure APIs are enabled
   - Check project permissions
   - Verify billing is enabled

3. **Runtime Errors**
   - Check application logs
   - Verify environment variables
   - Test locally first

### Debug Commands
```bash
# Check build status
gcloud builds list --limit=5

# View build logs
gcloud builds log <BUILD_ID>

# Check application status
gcloud app describe

# SSH into instance (for debugging)
gcloud app instances ssh
```

## 📚 Resources

- [Google Cloud App Engine Documentation](https://cloud.google.com/appengine)
- [Google Cloud Build Documentation](https://cloud.google.com/build)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment)

## 🎉 Success!

Once deployed, your LetzPocket application will be available at:
- `https://your-project-id.appspot.com`
- Custom domain (if configured)

The application includes:
- ✅ Marketing landing page
- ✅ Lead capture with Mailchimp integration
- ✅ Free tenancy agreement review
- ✅ Authentication system
- ✅ Property management tools
- ✅ Email workflow support
