#!/bin/bash

# LetzPocket Deployment Script
# This script deploys the app and updates GCP architecture documentation

set -e  # Exit on any error

echo "🚀 Starting LetzPocket Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build the React app
print_status "Step 1: Building React application..."
npm run build
if [ $? -eq 0 ]; then
    print_success "React build completed successfully"
else
    print_error "React build failed"
    exit 1
fi

# Step 2: Deploy to Firebase Hosting
print_status "Step 2: Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -eq 0 ]; then
    print_success "Firebase deployment completed successfully"
else
    print_error "Firebase deployment failed"
    exit 1
fi

# Step 3: Update GCP Architecture Documentation
print_status "Step 3: Updating GCP Architecture Documentation..."

# Check if gcp-architecture.md exists
if [ -f "gcp-architecture.md" ]; then
    # Backup current version
    print_status "Backing up current GCP architecture documentation..."
    cp gcp-architecture.md gcp-architecture.md.old
    print_success "Current version backed up as gcp-architecture.md.old"
else
    print_warning "No existing gcp-architecture.md file found"
fi

# Generate new GCP architecture documentation
print_status "Generating new GCP architecture documentation..."

cat > gcp-architecture.md << 'EOF'
# LetzPocket GCP Architecture Documentation

## Overview
LetzPocket is a UK rental property management platform built with React and deployed on Google Cloud Platform (GCP).

## Architecture Components

### Frontend
- **Framework:** React 18 with TypeScript
- **Hosting:** Firebase Hosting (static site)
- **Domain:** letzpocket-site.web.app
- **Build Tool:** Create React App
- **Styling:** Tailwind CSS

### Backend Services
- **CMS:** Strapi Headless CMS
- **Database:** PostgreSQL (via Strapi)
- **Authentication:** Firebase Authentication
- **API:** RESTful APIs (Strapi + Firebase)

### GCP Services Used

#### Firebase Hosting
- **Purpose:** Static website hosting
- **Features:** 
  - Global CDN distribution
  - HTTPS by default
  - Automatic scaling
  - Custom domain support
- **Configuration:** `firebase.json`

#### Firebase Authentication
- **Purpose:** User authentication and authorization
- **Features:**
  - Email/password authentication
  - Social login support
  - Session management
  - Role-based access control

#### Firestore Database
- **Purpose:** NoSQL database for real-time data
- **Features:**
  - Real-time synchronization
  - Offline support
  - Scalable document database
  - Security rules

#### Cloud Functions (Optional)
- **Purpose:** Server-side business logic
- **Features:**
  - Event-driven functions
  - HTTP endpoints
  - Background processing
  - Auto-scaling

## Deployment Architecture

### CI/CD Pipeline
```mermaid
graph LR
    A[Developer] --> B[Git Push]
    B --> C[Build React App]
    C --> D[Firebase Deploy]
    D --> E[Update Documentation]
    E --> F[Live Site]
```

### Network Architecture
```
Internet → Firebase Hosting (CDN) → React App
                                    ↓
                              Firebase Auth
                                    ↓
                              Strapi CMS
                                    ↓
                              PostgreSQL DB
```

## Security Considerations

### Firebase Security Rules
- Firestore rules restrict data access
- Authentication required for admin functions
- CORS properly configured

### Best Practices
- Environment variables for sensitive data
- HTTPS enforced everywhere
- Regular security updates
- Input validation and sanitization

## Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Service worker for caching

### Backend
- Database indexing
- API response caching
- CDN for static assets
- Connection pooling

## Monitoring and Logging

### Firebase Monitoring
- Performance monitoring
- Error tracking
- Usage analytics
- Custom events

### Strapi Monitoring
- API request logging
- Database performance
- User activity tracking
- Error reporting

## Scalability Considerations

### Horizontal Scaling
- Firebase Hosting auto-scales
- Firestore handles concurrent users
- Strapi can be containerized
- Database can be sharded

### Vertical Scaling
- Increase Firebase plan limits
- Upgrade Strapi server resources
- Optimize database performance
- Implement caching layers

## Disaster Recovery

### Backup Strategy
- Automated database backups
- Git repository for code
- Firebase data exports
- Documentation versioning

### Recovery Procedures
- Rollback to previous deployment
- Restore from database backups
- Emergency contact procedures
- Service restoration checklist

## Cost Management

### Firebase Pricing
- Hosting: Free tier + pay-as-you-go
- Authentication: Free tier + usage-based
- Firestore: Free tier + usage-based
- Functions: Pay-per-invocation

### Strapi Hosting
- Self-hosted: Server costs
- Cloud: Platform fees
- Database: Storage and compute
- Bandwidth: Data transfer costs

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Mobile app development
- API rate limiting
- Advanced search functionality

### Technical Improvements
- Microservices architecture
- GraphQL API implementation
- Advanced caching strategies
- Machine learning integration
- Progressive Web App (PWA)

## Contact Information
- **Project:** LetzPocket
- **Repository:** [Git Repository URL]
- **Documentation:** Last updated: $(date)
- **Deployment:** Automated via deploy.sh script

---
*This documentation is automatically generated during deployment process*
EOF

# Add deployment timestamp
echo "" >> gcp-architecture.md
echo "## Deployment Information" >> gcp-architecture.md
echo "" >> gcp-architecture.md
echo "- **Last Deployed:** $(date)" >> gcp-architecture.md
echo "- **Deployed By:** $(whoami)" >> gcp-architecture.md
echo "- **Git Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')" >> gcp-architecture.md
echo "- **Build Version:** $(node -p "require('./package.json').version" 2>/dev/null || echo 'N/A')" >> gcp-architecture.md

print_success "GCP architecture documentation updated successfully"

# Step 4: Summary
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  ✅ React app built and deployed to Firebase"
echo "  ✅ GCP architecture documentation updated"
echo "  ✅ Previous documentation backed up"
echo ""
echo "🌐 Live Site: https://letzpocket-site.web.app"
echo "📚 Documentation: ./gcp-architecture.md"
echo "🗂️  Backup: ./gcp-architecture.md.old"
echo ""
print_success "LetzPocket is now live! 🚀"
