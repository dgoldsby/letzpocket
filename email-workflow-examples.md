# LetzPocket Email Workflow Examples

## Overview
Email workflows enable users to interact with LetzPocket without using the web interface. Users can send emails with commands and attachments to trigger automated processing.

## Email Address Setup
```
letz-pocket@yourdomain.com
```

## Supported Email Commands

### 1. Tenancy Agreement Analysis

#### Basic Analysis
```
To: letz-pocket@yourdomain.com
Subject: Analyze Tenancy Agreement

Please analyze the attached tenancy agreement for my property at 123 High Street, London SW1A 1AA.

[Attach: tenancy_agreement.pdf]
```

#### Analysis with Specific Property
```
To: letz-pocket@yourdomain.com
Subject: Analyze Agreement - Property ID: prop_123

Please analyze the attached agreement for property ID prop_123.

[Attach: renewed_tenancy.pdf]
```

#### High Priority Analysis
```
To: letz-pocket@yourdomain.com
Subject: URGENT: Agreement Analysis Needed

URGENT: Please analyze this tenancy agreement immediately. New tenant moving in next week.

Property: 45 Oak Avenue, Manchester M1 2AB
[Attach: new_tenancy_agreement.pdf]
```

### 2. Property Updates

#### Update Rental Amount
```
To: letz-pocket@yourdomain.com
Subject: Update Rent - Property ID: prop_456

Please update the monthly rent for property ID prop_456 to £1,250 effective from 1st March 2024.

Current rent: £1,100
New rent: £1,250
Effective date: 2024-03-01
```

#### Update Property Value
```
To: letz-pocket@yourdomain.com
Subject: Property Valuation Update

Update property valuation for 78 Park Road, Bristol BS1 3CD:

New estimated value: £425,000
Valuation date: 2024-02-01
Source: Local estate agent appraisal
```

#### Update Tenant Information
```
To: letz-pocket@yourdomain.com
Subject: New Tenant Information

Property ID: prop_789
Address: 12 Church Lane, Birmingham B1 1AA

New tenant details:
Name: Sarah Johnson
Email: sarah.johnson@email.com
Phone: 07700 900123
Start date: 2024-03-01
Monthly rent: £950
Deposit: £1,140
```

### 3. Yield Calculations

#### Portfolio Yield Analysis
```
To: letz-pocket@yourdomain.com
Subject: Calculate Portfolio Yield

Please calculate the current yield for my entire portfolio.

Include:
- All properties
- Current market values
- Actual rental income
- 5% vacancy rate assumption
- Standard maintenance costs
```

#### Specific Property Yield
```
To: letz-pocket@yourdomain.com
Subject: Yield Calculation - Property ID: prop_123

Calculate yield for property ID prop_123 with the following assumptions:
- Vacancy rate: 8%
- Annual maintenance: £2,400
- Insurance: £600
- Management fees: £1,200
```

### 4. Property Valuations

#### Automated Valuation Request
```
To: letz-pocket@yourdomain.com
Subject: Property Valuation Request

Please provide an automated valuation for:

Property Details:
Address: 25 Victoria Street, London SW1H 0EU
Postcode: SW1H 0EU
Type: 2-bedroom flat
Bedrooms: 2
Bathrooms: 1
Square footage: 750 sq ft
Condition: Good
Features: Garden, Parking, Central heating
```

#### Market Data Request
```
To: letz-pocket@yourdomain.com
Subject: Market Data - SW1A 1AA

Please provide current market data for postcode SW1A 1AA:
- Average property prices
- Price per square foot
- Market trends
- Average rental yields
- Recent comparable sales
```

## Email Response Templates

### Analysis Completion Response
```
Subject: ✅ Tenancy Agreement Analysis Complete

Dear [User Name],

Your tenancy agreement analysis is complete.

📋 Analysis Summary:
- Property: 123 High Street, London SW1A 1AA
- Compliance Score: 72%
- Status: Needs Attention
- Processing Time: 2 minutes

🚨 Issues Found (3):
1. HIGH: Missing Renters Rights Act compliance clause
2. MEDIUM: Unclear rent increase terms
3. LOW: Outdated termination notice period

💡 Recommendations:
- Add specific clause referencing Renters Rights Act 2024
- Clarify 2-month notice period for rent increases
- Update termination notice periods to current requirements

📄 Full Report:
View detailed analysis in your LetzPocket dashboard:
https://letz-pocket.app/analyses/analysis_123

Best regards,
LetzPocket Team
```

### Property Update Confirmation
```
Subject: ✅ Property Updated Successfully

Dear [User Name],

Your property has been updated successfully.

🏠 Property Details:
- Address: 45 Oak Avenue, Manchester M1 2AB
- Property ID: prop_456

💰 Rental Update:
- Previous rent: £1,100/month
- New rent: £1,250/month
- Effective from: 2024-03-01
- Annual increase: 13.6%

📊 Impact Analysis:
- New gross yield: 6.8%
- New net yield: 5.2%
- Additional annual income: £1,800

View updated property details:
https://letz-pocket.app/properties/prop_456

Best regards,
LetzPocket Team
```

### Yield Calculation Results
```
Subject: 📊 Portfolio Yield Analysis Results

Dear [User Name],

Your portfolio yield analysis is complete.

📈 Portfolio Summary:
- Total Properties: 3
- Total Portfolio Value: £1,350,000
- Total Annual Income: £67,200
- Portfolio Gross Yield: 5.0%
- Portfolio Net Yield: 4.1%

🏠 Individual Property Results:
1. 123 High Street - Net Yield: 5.2% ✅
2. 45 Oak Avenue - Net Yield: 3.8% ⚠️
3. 78 Park Road - Net Yield: 4.1% ✅

💡 Optimization Opportunities:
- Consider rent review for 45 Oak Avenue (below average yield)
- Review maintenance costs across portfolio
- Explore premium features for higher rental income

View full analysis:
https://letz-pocket.app/yield/calculation_456

Best regards,
LetzPocket Team
```

## Advanced Email Features

### Batch Processing
```
To: letz-pocket@yourdomain.com
Subject: Batch Property Updates

Please update the following properties:

Property ID: prop_123 - Monthly rent: £1,300
Property ID: prop_456 - Status: vacant
Property ID: prop_789 - New value: £380,000

Process all updates and send confirmation for each.
```

### Scheduled Commands
```
To: letz-pocket@yourdomain.com
Subject: Scheduled Monthly Report

Please send me a monthly portfolio report on the 1st of each month including:
- Portfolio performance summary
- Yield calculations
- Property valuations
- Upcoming lease expirations
- Maintenance recommendations

Schedule: Monthly on 1st at 9:00 AM
```

### Conditional Processing
```
To: letz-pocket@yourdomain.com
Subject: Conditional Analysis

Analyze the attached agreement only if:
1. Property is in London postcodes (SW, EC, W, N, E, SE)
2. Monthly rent is above £2,000
3. Agreement type is AST (Assured Shorthold Tenancy)

If conditions are not met, notify me with reasons.

[Attach: high_value_tenancy.pdf]
```

## Error Handling Responses

### Invalid Command
```
Subject: ❌ Unable to Process Request

Dear [User Name],

We couldn't process your email request.

❌ Issues Found:
- Property ID "prop_999" not found in your portfolio
- Invalid rent amount format: "£1.200.50"

✅ Correct Format Examples:
- Property ID: prop_123
- Rent amount: £1,200.50

Please resend your request with the correct format.

Best regards,
LetzPocket Team
```

### Document Processing Error
```
Subject: ❌ Document Processing Failed

Dear [User Name],

We encountered issues processing your document.

❌ Processing Error:
- File type not supported: .jpg
- Supported formats: PDF, DOC, DOCX

✅ Solution:
Please resend the document in PDF format and ensure it's clear and readable.

If you continue to experience issues, contact support at support@letz-pocket.app

Best regards,
LetzPocket Team
```

## Security & Authentication

### Email Verification
- Only process emails from verified user addresses
- Optional two-factor authentication for sensitive operations
- Email signature verification for security

### Rate Limiting
- Maximum 10 requests per hour per user
- Bulk processing requires prior approval
- Large file uploads (>10MB) require confirmation

### Audit Trail
- All email requests logged with timestamps
- Processing history available in dashboard
- Error notifications for failed operations

## Integration with Other Systems

### CRM Integration
```
To: letz-pocket@yourdomain.com
Subject: CRM Sync - New Lead

Sync new property lead from CRM:

Lead ID: lead_456
Source: Rightmove
Property: 15 New Street, London E1 6AN
Contact: John Smith (john@smith-properties.com)
Estimated value: £500,000
Potential rent: £2,000/month
```

### Accounting Integration
```
To: letz-pocket@yourdomain.com
Subject: Accounting Sync - Rental Income

Sync rental income for January 2024:

Property ID: prop_123
Amount received: £1,200
Payment date: 2024-01-01
Tenant: Sarah Johnson
Reference: JAN2024_RENT_PROP123
```

This email workflow system enables seamless integration with LetzPocket's functionality while maintaining security and providing comprehensive automation capabilities.
