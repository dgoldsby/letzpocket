# PropertyData API Integration Strategy

## Overview
PropertyData provides comprehensive UK property market analytics with per-call pricing. This integration strategy focuses on cost efficiency while providing rich property insights for LetzPocket users.

## Key API Endpoints for LetzPocket

### Core Property Data (1 credit each)
- **`/valuation-rent`** - Estimated rental valuation for specific properties
- **`/sold-prices`** - Historical sold price statistics 
- **`/rents`** - Current rental market statistics
- **`/growth`** - 5-year capital growth figures
- **`/demographics`** - Population and area demographics

### Additional Valuable Endpoints
- **`/area-type`** - Property type distribution in area
- **`/council-tax`** - Council tax bands
- **`/energy-efficiency`** - EPC ratings and energy costs
- **`/crime`** - Area crime statistics
- **`/flood-risk`** - Flood risk assessment

## Integration Architecture

### 1. Database Schema Extensions

```sql
-- Property data cache table
CREATE TABLE property_data_cache (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  postcode VARCHAR(10) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'valuation', 'rents', 'sold_prices', etc.
  api_response JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  api_cost_credits INTEGER DEFAULT 1,
  INDEX idx_property_postcode (property_id, postcode),
  INDEX idx_data_type_expires (data_type, expires_at)
);

-- Historical tracking for value changes
CREATE TABLE property_value_history (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  valuation_date DATE NOT NULL,
  rental_value DECIMAL(12,2),
  sale_value DECIMAL(12,2),
  confidence_interval_lower DECIMAL(12,2),
  confidence_interval_upper DECIMAL(12,2),
  data_source VARCHAR(50) DEFAULT 'propertydata',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_property_date (property_id, valuation_date DESC)
);

-- API usage tracking
CREATE TABLE api_usage_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth_users(id),
  endpoint VARCHAR(100) NOT NULL,
  credits_used INTEGER NOT NULL,
  request_params JSONB,
  response_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_date (user_id, created_at DESC)
);
```

### 2. Caching Strategy

#### Cache Duration by Data Type
- **Valuations**: Monthly updates (30 days)
- **Rental Data**: Monthly updates (30 days) 
- **Sold Prices**: Quarterly updates (90 days)
- **Growth Data**: Quarterly updates (90 days)
- **Demographics**: Quarterly updates (90 days)
- **Area Statistics**: Monthly updates (30 days)

#### Smart Cache Invalidation
```typescript
interface CacheStrategy {
  data_type: string;
  cache_duration_days: number;
  force_refresh_threshold?: number; // days
}

const CACHE_STRATEGIES: CacheStrategy[] = [
  { data_type: 'valuation', cache_duration_days: 30, force_refresh_threshold: 7 },
  { data_type: 'rents', cache_duration_days: 30, force_refresh_threshold: 7 },
  { data_type: 'sold_prices', cache_duration_days: 90, force_refresh_threshold: 14 },
  { data_type: 'growth', cache_duration_days: 90, force_refresh_threshold: 30 },
  { data_type: 'demographics', cache_duration_days: 90, force_refresh_threshold: 30 }
];
```

### 3. Service Layer Implementation

```typescript
// services/propertyData.ts
export class PropertyDataService {
  private apiKey: string;
  private baseUrl = 'https://api.propertydata.co.uk';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPropertyValuation(postcode: string, propertyDetails: PropertyDetails): Promise<ValuationResponse> {
    return this.getCachedData('valuation', postcode, async () => {
      const params = new URLSearchParams({
        postcode,
        property_type: propertyDetails.type,
        construction_date: propertyDetails.constructionDate,
        finish_quality: propertyDetails.finishQuality,
        outdoor_space: propertyDetails.outdoorSpace,
        bedrooms: propertyDetails.bedrooms.toString()
      });
      
      return this.makeRequest(`/valuation-rent?${params}`);
    });
  }

  async getAreaRents(postcode: string): Promise<RentDataResponse> {
    return this.getCachedData('rents', postcode, () => {
      return this.makeRequest(`/rents?postcode=${encodeURIComponent(postcode)}`);
    });
  }

  async getSoldPrices(postcode: string): Promise<SoldPricesResponse> {
    return this.getCachedData('sold_prices', postcode, () => {
      return this.makeRequest(`/sold-prices?postcode=${encodeURIComponent(postcode)}`);
    });
  }

  private async getCachedData<T>(
    dataType: string, 
    postcode: string, 
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = await this.checkCache(dataType, postcode);
    if (cached && !this.shouldForceRefresh(dataType, cached.cached_at)) {
      return cached.api_response;
    }

    // Fetch fresh data
    const freshData = await fetcher();
    
    // Cache the response
    await this.cacheResponse(dataType, postcode, freshData);
    
    // Store historical data for valuations
    if (dataType === 'valuation') {
      await this.storeHistoricalValue(postcode, freshData);
    }
    
    return freshData;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}&key=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PropertyData API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log API usage
    await this.logApiUsage(endpoint, 1, 'success');
    
    return data;
  }
}
```

### 4. Cost Optimization Features

#### User Credit Quotas
```typescript
interface UserApiQuota {
  monthly_credits: number;
  used_credits: number;
  reset_date: Date;
}

class ApiQuotaManager {
  async checkUserQuota(userId: string): Promise<boolean> {
    const quota = await this.getUserQuota(userId);
    return quota.used_credits < quota.monthly_credits;
  }

  async deductCredits(userId: string, credits: number): Promise<void> {
    await this.updateUsage(userId, credits);
  }

  // Premium users get more credits
  async getQuotaByPlan(plan: string): Promise<number> {
    const quotas = {
      free: 10,
      professional: 100,
      enterprise: 500
    };
    return quotas[plan] || 10;
  }
}
```

#### Batch Processing
```typescript
// Process multiple properties in single requests where possible
async batchPropertyValuations(properties: Property[]): Promise<ValuationResponse[]> {
  // Group by postcode to maximize data per request
  const groupedByPostcode = this.groupByPostcode(properties);
  
  const results = await Promise.allSettled(
    Object.entries(groupedByPostcode).map(([postcode, props]) =>
      this.getAreaData(postcode) // Get area data once for all properties
    )
  );
  
  return this.processBatchResults(results, properties);
}
```

### 5. Integration Points in LetzPocket

#### Property Dashboard Enhancement
```typescript
// Enhanced property cards with PropertyData insights
const PropertyCard = ({ property }: { property: Property }) => {
  const [valuation, setValuation] = useState<ValuationResponse | null>(null);
  const [rentData, setRentData] = useState<RentDataResponse | null>(null);

  useEffect(() => {
    if (property.postcode) {
      // Load cached data immediately
      propertyDataService.getPropertyValuation(property.postcode, property)
        .then(setValuation);
      
      propertyDataService.getAreaRents(property.postcode)
        .then(setRentData);
    }
  }, [property.postcode]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{property.address}</CardTitle>
            <CardDescription>{property.postcode}</CardDescription>
          </div>
          {valuation && (
            <Badge variant="secondary">
              £{valuation.rental_value.toLocaleString()}/mo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Est. Rental Value</p>
            <p className="font-semibold">
              £{valuation?.rental_value.toLocaleString() || '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Area Avg. Rent</p>
            <p className="font-semibold">
              £{rentData?.average_rent?.toLocaleString() || '—'}/wk
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Yield Calculator Enhancement
```typescript
// Enhanced yield calculations with real market data
const YieldCalculator = ({ property }: { property: Property }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  const calculateYield = async () => {
    if (!property.postcode) return;

    // Get comprehensive market data
    const [valuation, rentData, soldPrices] = await Promise.all([
      propertyDataService.getPropertyValuation(property.postcode, property),
      propertyDataService.getAreaRents(property.postcode),
      propertyDataService.getSoldPrices(property.postcode)
    ]);

    // Calculate yield with market context
    const grossYield = (valuation.rental_value * 12) / property.purchasePrice * 100;
    const marketAdjustedYield = (rentData.average_rent * 4.333 * 12) / property.purchasePrice * 100;
    
    return {
      grossYield,
      marketAdjustedYield,
      confidenceInterval: valuation.confidence_interval,
      areaAverageYield: calculateAreaYield(soldPrices, rentData)
    };
  };

  return (
    // Enhanced yield calculator UI with market data
  );
};
```

### 6. Background Data Refresh

```typescript
// Scheduled tasks for data refresh
class DataRefreshScheduler {
  async refreshPropertyData(): Promise<void> {
    // Get properties needing refresh
    const staleProperties = await this.getStaleProperties();
    
    // Process in batches to respect API limits
    const batches = this.chunkArray(staleProperties, 10);
    
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(property => 
          this.refreshPropertyData(property.id, property.postcode)
        )
      );
      
      // Rate limiting: wait between batches
      await this.delay(1000);
    }
  }

  async refreshPropertyData(propertyId: string, postcode: string): Promise<void> {
    const property = await this.getProperty(propertyId);
    
    // Refresh key data types
    await Promise.allSettled([
      propertyDataService.getPropertyValuation(postcode, property),
      propertyDataService.getAreaRents(postcode),
      propertyDataService.getSoldPrices(postcode)
    ]);
    
    // Update last refreshed timestamp
    await this.updatePropertyRefreshTime(propertyId);
  }
}
```

## Implementation Priority

### Phase 1: Core Integration (Week 1-2)
1. **Database schema** - Add caching tables
2. **PropertyData service** - Basic API client with caching
3. **Property valuation** - Integrate into property cards
4. **API quota management** - Basic credit tracking

### Phase 2: Enhanced Features (Week 3-4)
1. **Area analytics** - Rental and sold price data
2. **Yield calculator** - Market-adjusted calculations
3. **Historical tracking** - Value change over time
4. **Background refresh** - Automated data updates

### Phase 3: Admin Features (Week 3-4)
1. **Quota management system** - Dynamic plan management
2. **Admin dashboard** - User quota monitoring
3. **Bulk operations** - Efficient user management
4. **Credit granting** - Bonus credit allocation

### Phase 4: Advanced Features (Week 5-6)
1. **Demographics integration** - Area insights
2. **Batch processing** - Cost optimization
3. **Advanced analytics** - Trends and forecasts
4. **User dashboards** - Enhanced reporting

## Admin Quota Management System

### Features
- **Dynamic Plan Management**: Change user subscriptions in real-time
- **Bulk Operations**: Update multiple users simultaneously
- **Credit Granting**: Award bonus credits for special circumstances
- **Usage Monitoring**: Real-time quota tracking and alerts
- **System Health**: API performance and cache hit rate monitoring

### Admin Capabilities
```typescript
// Update individual user plan
await propertyDataAdmin.updateUserPlan('user123', 'professional', 'admin456');

// Bulk update multiple users
await propertyDataAdmin.bulkUpdatePlans([
  { userId: 'user123', planId: 'enterprise' },
  { userId: 'user456', planId: 'professional' }
], 'admin456');

// Grant bonus credits
await propertyDataAdmin.grantBonusCredits('user123', 50, 'Compensation for outage', 'admin456');

// Get admin dashboard data
const dashboard = await propertyDataAdmin.getAdminDashboard();
```

### Security & Access Control

#### Role-Based Access
- **Administrator only**: Dashboard restricted to users with ADMINISTRATOR role
- **Authentication check**: Verifies user is logged in and has proper role
- **Access denied**: Clear error messaging for unauthorized users
- **Audit trail**: All admin actions logged with admin user ID

#### Security Features
- **Session validation**: Ensures valid admin session
- **Action logging**: Tracks all quota changes and credit grants
- **Input validation**: Sanitizes all user inputs
- **CSRF protection**: Prevents cross-site request forgery

### Available Plans
- **Free**: 10 credits/month - Basic valuation access
- **Professional**: 100 credits/month - Full feature access
- **Enterprise**: 500 credits/month - Unlimited usage + API access
- **Trial**: 50 credits - 14-day full access

### Cost Management
- **Real-time tracking** of all API usage
- **Automatic quota resets** on monthly cycle
- **Usage alerts** when approaching limits
- **Efficiency metrics** for optimization opportunities

## Cost Management

### Expected API Usage
- **Free users**: 10 properties × 6 data types = 60 credits/month
- **Professional users**: 100 properties × 6 data types = 600 credits/month  
- **Enterprise users**: 500+ properties × 6 data types = 3000+ credits/month

### Cost Optimization Strategies
1. **Aggressive caching** - Reduce repeat calls by 80%
2. **Batch processing** - Group requests by postcode
3. **Selective refresh** - Only update changed data
4. **User quotas** - Prevent overages
5. **Background jobs** - Off-peak processing

## Security & Compliance

### API Key Management
- Store API keys in environment variables
- Rotate keys quarterly
- Monitor usage for anomalies
- Implement rate limiting per user

### Data Privacy
- Cache only necessary data
- Implement data retention policies
- GDPR compliance for user data
- Secure data transmission

## Monitoring & Analytics

### API Performance Tracking
- Response times per endpoint
- Error rates by data type
- Cache hit ratios
- Cost per user

### Business Metrics
- Property data refresh frequency
- User engagement with insights
- Feature adoption rates
- API cost optimization

This integration provides LetzPocket with comprehensive property market intelligence while maintaining cost efficiency through smart caching and quota management.
