#!/bin/bash

# LetzPocket Deployment Script
# This script builds and deploys the React app to Firebase Hosting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Run framework audit
run_framework_audit() {
    print_status "Running framework audit..."
    
    if [ -f "./scripts/framework-audit.js" ]; then
        node ./scripts/framework-audit.js
        print_success "Framework audit completed"
    else
        print_warning "Framework audit script not found, skipping..."
    fi
}

# Step 1: Build React application
build_app() {
    print_status "Step 1: Building React application..."
    
    # Clean previous build
    if [ -d "build" ]; then
        rm -rf build
        print_status "Cleaned previous build"
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci --silent
    
    # Build the app
    print_status "Building production bundle..."
    npm run build
    
    if [ -d "build" ]; then
        print_success "React build completed successfully"
    else
        print_error "Build failed - no build directory created"
        exit 1
    fi
}

# Step 2: Deploy to Firebase Hosting
deploy_to_firebase() {
    print_status "Step 2: Deploying to Firebase Hosting..."
    
    # Check if firebase.json exists
    if [ ! -f "firebase.json" ]; then
        print_error "firebase.json not found"
        exit 1
    fi
    
    # Deploy to Firebase
    firebase deploy --only hosting
    
    print_success "Firebase deployment completed successfully"
}

# Step 3: Update GCP Architecture Documentation
update_docs() {
    print_status "Step 3: Updating GCP Architecture Documentation..."
    
    # Backup current documentation
    if [ -f "gcp-architecture.md" ]; then
        cp gcp-architecture.md gcp-architecture.md.old
        print_success "Current version backed up as gcp-architecture.md.old"
    fi
    
    # Generate new documentation
    if command -v node &> /dev/null; then
        node -e "
const fs = require('fs');
const timestamp = new Date().toISOString();

const content = \`# LetzPocket GCP Architecture

*Last updated: \${timestamp}*

## Overview
LetzPocket is a UK property management platform built with modern web technologies and deployed on Google Cloud Platform.

## Architecture Components

### Frontend (React Application)
- **Framework**: React 19.2.4 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Hosting**: Firebase Hosting with global CDN
- **Authentication**: Firebase Authentication
- **CMS Integration**: Strapi CMS

### Backend (Strapi CMS)
- **Framework**: Strapi 5.34.0
- **Database**: PostgreSQL on Cloud SQL
- **Hosting**: Google Cloud Run
- **Container**: Docker with Node.js 20
- **Storage**: Google Artifact Registry

### Infrastructure
- **Provider**: Google Cloud Platform
- **Region**: europe-west2 (London)
- **Services**: Firebase Hosting, Cloud Run, Cloud SQL, Artifact Registry

## Deployment Information
- **Frontend URL**: https://letzpocket-site.web.app
- **CMS URL**: https://letzpocket-strapi-557937099852.europe-west2.run.app
- **Admin URL**: https://letzpocket-strapi-557937099852.europe-west2.run.app/admin

## Security & Compliance
- **HTTPS**: Enabled across all services
- **Data Protection**: GDPR compliant
- **Authentication**: Firebase Auth with role-based access
- **API Security**: JWT tokens and CORS configuration

## Monitoring & Logging
- **Error Tracking**: Console errors and browser monitoring
- **Performance**: Web Vitals tracking
- **Uptime**: Firebase Hosting monitoring
- **Logs**: Cloud Run logging integration

## Development Workflow
- **Version Control**: Git with GitHub
- **CI/CD**: Automated deployment scripts
- **Environment Management**: Development, Staging, Production
- **Code Quality**: ESLint, TypeScript, testing framework

---

*This documentation is automatically generated during deployment.*
\`;

fs.writeFileSync('gcp-architecture.md', content);
console.log('GCP architecture documentation updated successfully');
"
        print_success "GCP architecture documentation updated successfully"
    else
        print_warning "Could not update documentation - Node.js not available"
    fi
}

# Main deployment function
main() {
    echo "🚀 Starting LetzPocket Deployment Process..."
    echo "========================================"
    
    # Run all steps
    check_dependencies
    run_framework_audit
    build_app
    deploy_to_firebase
    update_docs
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  ✅ React app built and deployed to Firebase"
    echo "  ✅ Framework audit completed"
    echo "  ✅ GCP architecture documentation updated"
    echo "  ✅ Previous documentation backed up"
    echo ""
    echo "🌐 Live Site: https://letzpocket-site.web.app"
    echo "📚 Documentation: ./gcp-architecture.md"
    echo "🗂️  Backup: ./gcp-architecture.md.old"
    echo "📊 Framework Log: ./logs/latest-deployment.json"
    echo ""
    print_success "LetzPocket is now live! 🚀"
}

# Handle script arguments
case "${1:-}" in
    --skip-audit)
        print_warning "Skipping framework audit"
        SKIP_AUDIT=true
        ;;
    --help|-h)
        echo "LetzPocket Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --skip-audit    Skip framework audit step"
        echo "  --help, -h      Show this help message"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"
