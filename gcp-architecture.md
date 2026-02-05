# LetzPocket GCP Architecture

*Last updated: 2026-02-04T14:41:14.950Z*

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
