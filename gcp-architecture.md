# LetzPocket Google Cloud Platform Architecture

## Overview
Scalable, API-first architecture designed for multi-channel input processing (web, email, mobile) with serverless backend services.

## Core Architecture Components

### 1. API Gateway & Management
**Cloud API Gateway** or **Apigee**
- Centralized API management
- Authentication & authorization
- Rate limiting & quotas
- Request validation
- API versioning

### 2. Serverless Compute Layer
**Cloud Functions** & **Cloud Run**
- Event-driven functions for document processing
- RESTful services for core business logic
- Scalable microservices architecture

### 3. Document Processing Pipeline
**Cloud Vision AI** + **Cloud Natural Language**
- PDF/Document parsing
- Text extraction from tenancy agreements
- Compliance analysis engine
- OCR for scanned documents

### 4. Data Storage
**Cloud Firestore** (NoSQL) + **Cloud SQL** (Relational)
- Firestore: User data, property portfolios, real-time data
- Cloud SQL: Financial calculations, historical data, analytics
- **Cloud Storage**: Document storage, file uploads

### 5. Email Processing Workflow
**Gmail API** + **Cloud Workflows**
- Email ingestion service
- Attachment processing
- Automated response generation
- Workflow orchestration

## Service Architecture

### Frontend Layer
```
React App → API Gateway → Cloud Functions/Cloud Run
```

### Email Processing Layer
```
Gmail → Cloud Pub/Sub → Cloud Functions → Processing Pipeline → Response
```

### Mobile App Support
```
Mobile App → API Gateway → Same backend services
```

## Detailed Service Breakdown

### 1. Property Management Service
```typescript
// Cloud Function / Cloud Run Service
interface PropertyService {
  createProperty(property: PropertyData): Promise<Property>
  updateProperty(id: string, updates: Partial<PropertyData>): Promise<Property>
  getProperty(id: string): Promise<Property>
  listProperties(userId: string): Promise<Property[]>
  deleteProperty(id: string): Promise<void>
}
```

### 2. Tenancy Agreement Analysis Service
```typescript
interface AgreementAnalysisService {
  analyzeAgreement(documentUrl: string): Promise<AnalysisResult>
  uploadAgreement(file: File): Promise<string> // Returns document URL
  getAnalysisHistory(userId: string): Promise<Analysis[]>
  generateReport(analysisId: string): Promise<Report>
}
```

### 3. Yield Calculation Service
```typescript
interface YieldCalculationService {
  calculateYield(properties: PropertyData[]): Promise<YieldResult[]>
  calculatePortfolioMetrics(userId: string): Promise<PortfolioMetrics>
  getYieldHistory(propertyId: string): Promise<YieldHistory[]>
}
```

### 4. Property Valuation Service
```typescript
interface ValuationService {
  estimateValue(propertyDetails: PropertyDetails): Promise<ValuationResult>
  getMarketData(postcode: string): Promise<MarketData>
  updateValuation(propertyId: string): Promise<ValuationResult>
}
```

### 5. Email Processing Service
```typescript
interface EmailProcessingService {
  processEmail(emailId: string): Promise<ProcessingResult>
  extractAttachments(emailId: string): Promise<Attachment[]>
  generateResponse(processingResult: ProcessingResult): Promise<EmailResponse>
}
```

## Cloud Storage Structure

### Cloud Storage Buckets
```
letz-pocket-documents/
  ├── agreements/
  │   ├── {userId}/
  │   │   ├── {documentId}.pdf
  │   │   └── {documentId}_analysis.json
  ├── property-images/
  ├── reports/
  └── temp-uploads/
```

### Firestore Collections
```
users/{userId}
  ├── profile
  ├── properties/{propertyId}
  ├── analyses/{analysisId}
  └── settings

properties/{propertyId}
  ├── details
  ├── valuations/
  ├── yield-history/
  └── documents/

analyses/{analysisId}
  ├── results
  ├── issues
  ├── recommendations
  └── metadata
```

## Email Workflow Architecture

### Email Processing Pipeline
1. **Ingestion**: Gmail API monitors specific labels/addresses
2. **Extraction**: Cloud Functions extract attachments and content
3. **Classification**: Natural Language AI categorizes email intent
4. **Processing**: Route to appropriate service (agreement analysis, property update, etc.)
5. **Response**: Generate automated email with results

### Email Command Examples
```
Subject: Analyze Tenancy Agreement
Body: Please analyze the attached tenancy agreement for 123 High Street
Attachment: tenancy_agreement.pdf

→ Triggers: AgreementAnalysisService.analyzeAgreement()
→ Returns: Analysis results via email
```

```
Subject: Update Property Value
Body: Update valuation for property ID: prop_123 to £450,000

→ Triggers: PropertyService.updateProperty()
→ Returns: Confirmation email
```

## API Design

### RESTful API Structure
```
POST /api/v1/properties
GET /api/v1/properties/{userId}
PUT /api/v1/properties/{id}
DELETE /api/v1/properties/{id}

POST /api/v1/analyses/upload
GET /api/v1/analyses/{id}
GET /api/v1/analyses/user/{userId}

POST /api/v1/yield/calculate
GET /api/v1/yield/portfolio/{userId}

POST /api/v1/valuations/estimate
GET /api/v1/valuations/{propertyId}
```

### Authentication & Security
- **Firebase Authentication** for user management
- **OAuth 2.0** for API access
- **API Keys** for service-to-service communication
- **Cloud KMS** for encryption key management

## Deployment Configuration

### Cloud Functions
```yaml
# functions.yaml
functions:
  property-service:
    runtime: nodejs20
    trigger: http
    memory: 512Mi
    max_instances: 100
  
  agreement-analyzer:
    runtime: python311
    trigger: http
    memory: 1024Mi
    timeout: 540s
  
  email-processor:
    runtime: nodejs20
    trigger: pubsub
    memory: 256Mi
```

### Cloud Run Services
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/property-service', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/property-service']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args: ['gcloud', 'run', 'deploy', 'property-service', '--image', 'gcr.io/$PROJECT_ID/property-service']
```

## Monitoring & Observability

### Cloud Monitoring
- Custom metrics for API performance
- Error tracking and alerting
- Usage analytics and quotas

### Cloud Logging
- Structured logging for all services
- Audit trails for document processing
- Email workflow logging

### Error Handling
- Retry mechanisms with exponential backoff
- Dead letter queues for failed email processing
- Circuit breakers for external API calls

## Scalability Considerations

### Auto-scaling
- Cloud Functions: 0 to N instances based on load
- Cloud Run: Automatic scaling based on request volume
- Cloud SQL: High availability configuration

### Performance Optimization
- CDN for static assets
- Caching layer with Redis/Memorystore
- Database query optimization
- Batch processing for bulk operations

## Security & Compliance

### Data Protection
- Encryption at rest and in transit
- GDPR compliance for UK data
- Regular security audits
- Data retention policies

### Access Control
- Role-based access control (RBAC)
- Service accounts for inter-service communication
- Network security with VPC controls

## Migration Strategy

### Phase 1: Core Services
1. Deploy Property Management API
2. Implement Agreement Analysis Service
3. Set up basic email processing

### Phase 2: Advanced Features
1. Yield Calculation Service
2. Property Valuation Service
3. Advanced email workflows

### Phase 3: Optimization
1. Performance tuning
2. Advanced monitoring
3. Additional input channels (SMS, webhooks)

## Cost Optimization

### Serverless Benefits
- Pay-per-use pricing model
- No idle server costs
- Automatic scaling reduces over-provisioning

### Cost Monitoring
- Budget alerts
- Usage quotas
- Regular cost analysis

This architecture provides a solid foundation for LetzPocket's growth while maintaining flexibility for future frontend refactoring and additional input channels.
