import { 
  Property, 
  PropertyAnalytics, 
  ValuationData, 
  RentalMarketData, 
  SoldPricesData,
  DemographicsData,
  GrowthData 
} from '../types/property';

// PropertyData API response types
interface PropertyDataResponse<T> {
  data: T;
  status: string;
  request_id: string;
  processing_time_ms: number;
}

interface ValuationResponse {
  rental_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  property_type: string;
  postcode: string;
  radius?: number;
}

interface RentsResponse {
  average_rent: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  sample_size: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

interface SoldPricesResponse {
  average_price: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  sample_size: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

interface DemographicsResponse {
  population: number;
  average_age: number;
  household_income: number;
  employment_rate: number;
  sample_from_town_center?: boolean;
}

interface GrowthResponse {
  yearly_growth: number[];
  five_year_growth: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

// Cache strategies
interface CacheStrategy {
  data_type: string;
  cache_duration_days: number;
  force_refresh_threshold?: number;
}

const CACHE_STRATEGIES: CacheStrategy[] = [
  { data_type: 'valuation', cache_duration_days: 30, force_refresh_threshold: 7 },
  { data_type: 'rents', cache_duration_days: 30, force_refresh_threshold: 7 },
  { data_type: 'sold_prices', cache_duration_days: 90, force_refresh_threshold: 14 },
  { data_type: 'growth', cache_duration_days: 90, force_refresh_threshold: 30 },
  { data_type: 'demographics', cache_duration_days: 90, force_refresh_threshold: 30 }
];

// Database cache interface (would integrate with your existing database)
interface CacheEntry {
  property_id?: string;
  postcode: string;
  data_type: string;
  api_response: any;
  cached_at: Date;
  expires_at: Date;
  api_cost_credits: number;
}

export class PropertyDataService {
  private apiKey: string;
  private baseUrl = 'https://api.propertydata.co.uk';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_PROPERTYDATA_API_KEY || '';
  }

  /**
   * Get property valuation with rental value estimate
   */
  async getPropertyValuation(
    postcode: string, 
    propertyDetails?: {
      property_type?: string;
      bedrooms?: number;
      construction_date?: string;
      finish_quality?: string;
      outdoor_space?: string;
    }
  ): Promise<ValuationResponse> {
    return this.getCachedData('valuation', postcode, async () => {
      const params = new URLSearchParams({
        postcode: postcode.trim(),
        ...(propertyDetails?.property_type && { property_type: propertyDetails.property_type }),
        ...(propertyDetails?.bedrooms && { bedrooms: propertyDetails.bedrooms.toString() }),
        ...(propertyDetails?.construction_date && { construction_date: propertyDetails.construction_date }),
        ...(propertyDetails?.finish_quality && { finish_quality: propertyDetails.finish_quality }),
        ...(propertyDetails?.outdoor_space && { outdoor_space: propertyDetails.outdoor_space })
      });
      
      return this.makeRequest<ValuationResponse>(`/valuation-rent?${params}`);
    });
  }

  /**
   * Get current rental market statistics for an area
   */
  async getAreaRents(postcode: string): Promise<RentsResponse> {
    return this.getCachedData('rents', postcode, () => {
      return this.makeRequest<RentsResponse>(`/rents?postcode=${encodeURIComponent(postcode.trim())}`);
    });
  }

  /**
   * Get historical sold prices for an area
   */
  async getSoldPrices(postcode: string): Promise<SoldPricesResponse> {
    return this.getCachedData('sold_prices', postcode, () => {
      return this.makeRequest<SoldPricesResponse>(`/sold-prices?postcode=${encodeURIComponent(postcode.trim())}`);
    });
  }

  /**
   * Get 5-year capital growth data
   */
  async getGrowthData(postcode: string): Promise<GrowthResponse> {
    return this.getCachedData('growth', postcode, () => {
      return this.makeRequest<GrowthResponse>(`/growth?postcode=${encodeURIComponent(postcode.trim())}`);
    });
  }

  /**
   * Get demographic data for an area
   */
  async getDemographics(postcode: string): Promise<DemographicsResponse> {
    return this.getCachedData('demographics', postcode, () => {
      return this.makeRequest<DemographicsResponse>(`/demographics?postcode=${encodeURIComponent(postcode.trim())}`);
    });
  }

  /**
   * Get comprehensive property analytics (multiple data types)
   */
  async getPropertyAnalytics(
    postcode: string, 
    propertyDetails?: any
  ): Promise<PropertyAnalytics> {
    const [valuation, rents, soldPrices, growth, demographics] = await Promise.allSettled([
      this.getPropertyValuation(postcode, propertyDetails),
      this.getAreaRents(postcode),
      this.getSoldPrices(postcode),
      this.getGrowthData(postcode),
      this.getDemographics(postcode)
    ]);

    return {
      postcode,
      last_updated: new Date(),
      valuation: valuation.status === 'fulfilled' ? valuation.value : null,
      rental_market: rents.status === 'fulfilled' ? rents.value : null,
      sold_prices: soldPrices.status === 'fulfilled' ? soldPrices.value : null,
      growth: growth.status === 'fulfilled' ? growth.value : null,
      demographics: demographics.status === 'fulfilled' ? demographics.value : null,
      errors: [
        ...(valuation.status === 'rejected' ? [{ type: 'valuation', error: valuation.reason }] : []),
        ...(rents.status === 'rejected' ? [{ type: 'rents', error: rents.reason }] : []),
        ...(soldPrices.status === 'rejected' ? [{ type: 'sold_prices', error: soldPrices.reason }] : []),
        ...(growth.status === 'rejected' ? [{ type: 'growth', error: growth.reason }] : []),
        ...(demographics.status === 'rejected' ? [{ type: 'demographics', error: demographics.reason }] : [])
      ]
    };
  }

  /**
   * Batch process multiple properties efficiently
   */
  async batchPropertyAnalytics(properties: Array<{ postcode: string; details?: any }>): Promise<PropertyAnalytics[]> {
    // Group by postcode to minimize API calls
    const groupedByPostcode = new Map<string, Array<{ index: number; details?: any }>>();
    
    properties.forEach((prop, index) => {
      const postcode = prop.postcode.trim();
      if (!groupedByPostcode.has(postcode)) {
        groupedByPostcode.set(postcode, []);
      }
      groupedByPostcode.get(postcode)!.push({ index, details: prop.details });
    });

    const results: PropertyAnalytics[] = new Array(properties.length);
    
    // Process each unique postcode
    for (const [postcode, props] of groupedByPostcode) {
      try {
        const analytics = await this.getPropertyAnalytics(postcode, props[0]?.details);
        
        // Apply to all properties with this postcode
        props.forEach(({ index }) => {
          results[index] = analytics;
        });
      } catch (error) {
        console.error(`Failed to get analytics for postcode ${postcode}:`, error);
        
        // Set error result for all properties with this postcode
        props.forEach(({ index }) => {
          results[index] = {
            postcode,
            last_updated: new Date(),
            valuation: null,
            rental_market: null,
            sold_prices: null,
            growth: null,
            demographics: null,
            errors: [{ type: 'batch_error', error: error instanceof Error ? error.message : 'Unknown error' }]
          };
        });
      }
    }

    return results;
  }

  /**
   * Core caching logic with smart refresh
   */
  private async getCachedData<T>(
    dataType: string, 
    postcode: string, 
    fetcher: () => Promise<T>
  ): Promise<T> {
    const strategy = CACHE_STRATEGIES.find(s => s.data_type === dataType);
    if (!strategy) {
      throw new Error(`No cache strategy found for data type: ${dataType}`);
    }

    try {
      // Check cache first
      const cached = await this.checkCache(dataType, postcode);
      if (cached && !this.shouldForceRefresh(dataType, cached.cached_at)) {
        console.log(`Using cached ${dataType} data for ${postcode}`);
        return cached.api_response;
      }

      console.log(`Fetching fresh ${dataType} data for ${postcode}`);
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the response
      await this.cacheResponse(dataType, postcode, freshData, strategy.cache_duration_days);
      
      // Store historical data for valuations
      if (dataType === 'valuation') {
        await this.storeHistoricalValue(postcode, freshData as ValuationResponse);
      }
      
      return freshData;
    } catch (error) {
      console.error(`Error fetching ${dataType} for ${postcode}:`, error);
      
      // Try to return stale data if available
      const staleData = await this.checkCache(dataType, postcode);
      if (staleData) {
        console.warn(`Returning stale ${dataType} data for ${postcode} due to error`);
        return staleData.api_response;
      }
      
      throw error;
    }
  }

  /**
   * Make HTTP request to PropertyData API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('PropertyData API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}&key=${this.apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LetzPocket/1.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PropertyData API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Log API usage
      await this.logApiUsage(endpoint, 1, 'success');
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('PropertyData API request timeout');
      }
      
      await this.logApiUsage(endpoint, 1, 'error');
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Check if cached data exists and is valid
   */
  private async checkCache(dataType: string, postcode: string): Promise<CacheEntry | null> {
    // This would integrate with your database
    // For now, return null to always fetch fresh data
    return null;
  }

  /**
   * Cache API response
   */
  private async cacheResponse(
    dataType: string, 
    postcode: string, 
    response: any, 
    durationDays: number
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const cacheEntry: CacheEntry = {
      postcode: postcode.trim(),
      data_type: dataType,
      api_response: response,
      cached_at: new Date(),
      expires_at: expiresAt,
      api_cost_credits: 1
    };

    // This would integrate with your database
    console.log(`Caching ${dataType} for ${postcode} until ${expiresAt.toISOString()}`);
  }

  /**
   * Store historical valuation data
   */
  private async storeHistoricalValue(postcode: string, valuation: ValuationResponse): Promise<void> {
    // This would store in your property_value_history table
    console.log(`Storing historical valuation for ${postcode}: £${valuation.rental_value}`);
  }

  /**
   * Determine if data should be force refreshed
   */
  private shouldForceRefresh(dataType: string, cachedAt: Date): boolean {
    const strategy = CACHE_STRATEGIES.find(s => s.data_type === dataType);
    if (!strategy || !strategy.force_refresh_threshold) {
      return false;
    }

    const daysSinceCache = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCache > strategy.force_refresh_threshold;
  }

  /**
   * Log API usage for cost tracking
   */
  private async logApiUsage(endpoint: string, credits: number, status: string): Promise<void> {
    // This would integrate with your api_usage_log table
    console.log(`API Usage: ${endpoint} - ${credits} credits - ${status}`);
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    total_cached: number;
    cache_hit_rate: number;
    total_api_calls: number;
    credits_used: number;
  }> {
    // This would query your database for cache statistics
    return {
      total_cached: 0,
      cache_hit_rate: 0,
      total_api_calls: 0,
      credits_used: 0
    };
  }
}

// Singleton instance
export const propertyDataService = new PropertyDataService();
