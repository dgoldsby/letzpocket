// Chimnie API service for property data integration

export interface ChimnieProperty {
  _id: string;
  address: {
    full: string;
    street: string;
    locality: string;
    town: string;
    county: string;
    postcode: string;
    country: string;
  };
  basic_info: {
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    reception_rooms: number;
    floor_area_sqm: number;
    year_built: number;
    tenure: string;
    council_tax_band: string;
    epc_rating: string;
    epc_current_energy: number;
    epc_potential_energy: number;
  };
  financials: {
    estimated_price: number;
    estimated_rent_pcm: number;
    price_per_sqft: number;
    rental_yield: number;
    last_sold_price?: number;
    last_sold_date?: string;
    price_history: Array<{
      date: string;
      price: number;
    }>;
  };
  features: {
    garden: boolean;
    parking: boolean;
    garage: boolean;
    balcony: boolean;
    conservatory: boolean;
    double_glazing: boolean;
    central_heating: string;
    property_condition: string;
  };
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    nearby_schools: Array<{
      name: string;
      rating: string;
      distance_km: number;
    }>;
    nearby_transport: Array<{
      type: string;
      name: string;
      distance_km: number;
    }>;
    crime_rates: {
      overall: number;
      burglary: number;
      violence: number;
      vehicle: number;
      theft: number;
    };
    market_data: {
      area_average_price: number;
      area_average_rent: number;
      price_trend: 'rising' | 'falling' | 'stable';
      days_on_market: number;
    };
  }
  images?: Array<{
    url: string;
    caption: string;
    type: string;
  }>;
  last_updated: string;
  photos?: Array<{
    url: string;
    caption: string;
    type: string;
  }>;
}

export interface ChimnieSearchResponse {
  properties: ChimnieProperty[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ChimnieAreaData {
  postcode: string;
  area_name: string;
  average_price: number;
  average_rent: number;
  price_per_sqft: number;
  rental_yield: number;
  property_types_distribution: Record<string, number>;
  market_trends: {
    monthly_prices: Array<{
      month: string;
      average_price: number;
    }>;
    yearly_growth: number;
  };
  demographics: {
    population_density: number;
    average_income: number;
    employment_rate: number;
    age_distribution: Record<string, number>;
  };
}

export class ChimnieService {
  private readonly BASE_URL = 'https://api.chimnie.com';
  private readonly API_KEY = process.env.REACT_APP_CHIMNIE_API_KEY || '';

  /**
   * Search for properties using Chimnie API
   */
  private readonly DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.API_KEY}`,
    'User-Agent': 'LetzPocket/1.0'
  };

  /**
   * Search for properties by postcode or address
   */
  async searchProperties(params: {
    postcode?: string;
    address?: string;
    property_type?: string;
    bedrooms_min?: number;
    bedrooms_max?: number;
    price_min?: number;
    price_max?: number;
    page?: number;
    per_page?: number;
  }): Promise<ChimnieSearchResponse> {
    const searchParams = new URLSearchParams();
    
    // Add search parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await this.makeRequest(`/properties/search?${searchParams.toString()}`);
    return response.json();
  }

  /**
   * Get detailed property information by ID
   */
  async getProperty(propertyId: string): Promise<ChimnieProperty | null> {
    try {
      const response = await this.makeRequest(`/properties/${propertyId}`);
      return response.json();
    } catch (error: any) {
      console.error('Failed to get Chimnie property:', error);
      return null;
    }
  }

  /**
   * Get comprehensive residential address data with specific fields
   */
  async getResidentialAddressData(fullAddress: string): Promise<{
    address: {
      full: string;
      street: string;
      town: string;
      postcode: string;
    };
    value: {
      sale: number;
      rental: number;
    };
    bills: {
      tax: number;
      energy: number;
      telecomms: number;
    };
    last_updated: string;
  } | null> {
    try {
      const response = await this.makeRequest('/residential/address', {
        method: 'POST',
        body: JSON.stringify({
          address: fullAddress,
          fields: [
            'Value:Sale',
            'Value:Rental', 
            'Bills:Tax',
            'Bills:Energy',
            'Bills:Telecomms'
          ]
        })
      });
      
      const data = await response.json();
      
      // Transform the response to match our expected format
      return {
        address: data.address || {
          full: fullAddress,
          street: '',
          town: '',
          postcode: ''
        },
        value: {
          sale: data.value?.sale || 0,
          rental: data.value?.rental || 0
        },
        bills: {
          tax: data.bills?.tax || 0,
          energy: data.bills?.energy || 0,
          telecomms: data.bills?.telecomms || 0
        },
        last_updated: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Failed to get residential address data:', error);
      return null;
    }
  }

  /**
   * Get comprehensive area data for a postcode
   */
  async getAreaData(postcode: string): Promise<ChimnieAreaData | null> {
    try {
      const response = await this.makeRequest(`/areas/${postcode}`);
      return response.json();
    } catch (error: any) {
      console.error('Failed to get Chimnie area data:', error);
      return null;
    }
  }

  /**
   * Get property valuation estimate
   */
  async getPropertyValuation(propertyData: {
    postcode: string;
    property_type: string;
    bedrooms: number;
    floor_area_sqm?: number;
    year_built?: number;
    condition?: string;
  }): Promise<{
    estimated_price: number;
    confidence_level: 'high' | 'medium' | 'low';
    comparable_properties: Array<{
      address: string;
      price: number;
      distance_km: number;
    }>;
  } | null> {
    try {
      const response = await this.makeRequest('/valuation/estimate', {
        method: 'POST',
        body: JSON.stringify(propertyData)
      });
      return response.json();
    } catch (error: any) {
      console.error('Failed to get Chimnie valuation:', error);
      return null;
    }
  }

  /**
   * Get rental market analysis for an area
   */
  async getRentalMarket(postcode: string): Promise<{
    average_rent: number;
    rental_yield: number;
    vacancy_rate: number;
    demand_level: 'high' | 'medium' | 'low';
    seasonal_trends: Array<{
      month: string;
      average_rent: number;
    }>;
  } | null> {
    try {
      const response = await this.makeRequest(`/market/rental/${postcode}`);
      return response.json();
    } catch (error: any) {
      console.error('Failed to get Chimnie rental market:', error);
      return null;
    }
  }

  /**
   * Get sales history for an area
   */
  async getSalesHistory(postcode: string, months: number = 12): Promise<{
    total_sales: number;
    average_price: number;
    price_trend: 'increasing' | 'decreasing' | 'stable';
    monthly_sales: Array<{
      month: string;
      count: number;
      average_price: number;
    }>;
  } | null> {
    try {
      const response = await this.makeRequest(`/market/sales/${postcode}?months=${months}`);
      return response.json();
    } catch (error: any) {
      console.error('Failed to get Chimnie sales history:', error);
      return null;
    }
  }

  /**
   * Enrich property data with Chimnie information
   */
  async enrichPropertyData(propertyData: any): Promise<ChimnieProperty | null> {
    // Try to find property by address first
    if (propertyData.address && propertyData.postcode) {
      const searchResults = await this.searchProperties({
        address: propertyData.address,
        postcode: propertyData.postcode,
        per_page: 1
      });

      if (searchResults.properties.length > 0) {
        return searchResults.properties[0];
      }
    }

    return null;
  }

  /**
   * Get comparable properties for valuation
   */
  async getComparableProperties(postcode: string, propertyType: string, bedrooms: number): Promise<ChimnieProperty[]> {
    try {
      const response = await this.searchProperties({
        postcode,
        property_type: propertyType,
        bedrooms_min: Math.max(1, bedrooms - 1),
        bedrooms_max: bedrooms + 1,
        per_page: 5
      });
      return response.properties;
    } catch (error) {
      console.error('Failed to get comparable properties:', error);
      return [];
    }
  }

  /**
   * Make HTTP request to Chimnie API
   */
  private async makeRequest(endpoint: string, options: {
    method?: 'GET' | 'POST';
    body?: string;
  } = {}): Promise<Response> {
    // Check if API key is configured
    if (!this.API_KEY) {
      throw new Error('Chimnie API key not configured. Please add REACT_APP_CHIMNIE_API_KEY to your environment variables.');
    }

    const url = `${this.BASE_URL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: this.DEFAULT_HEADERS,
    };

    if (options.body) {
      requestOptions.body = options.body;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Chimnie API error: ${response.status} - ${response.statusText}`;
        
        // Add more specific error messages for common status codes
        if (response.status === 401) {
          errorMessage = 'Chimnie API: Invalid API key. Please check your REACT_APP_CHIMNIE_API_KEY configuration.';
        } else if (response.status === 403) {
          errorMessage = 'Chimnie API: Access forbidden. Your API key may not have sufficient permissions.';
        } else if (response.status === 429) {
          errorMessage = 'Chimnie API: Rate limit exceeded. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Chimnie API request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Transform Chimnie property to our Property interface
   */
  static transformChimnieProperty(chimnieProperty: ChimnieProperty): any {
    return {
      address: chimnieProperty.address.full,
      postcode: chimnieProperty.address.postcode,
      city: chimnieProperty.address.town,
      property_type: chimnieProperty.basic_info.property_type,
      bedrooms: chimnieProperty.basic_info.bedrooms,
      purchasePrice: chimnieProperty.financials.estimated_price,
      currentValue: chimnieProperty.financials.estimated_price,
      monthlyRent: chimnieProperty.financials.estimated_rent_pcm,
      constructionDate: chimnieProperty.basic_info.year_built?.toString(),
      finishQuality: chimnieProperty.features.property_condition,
      outdoorSpace: chimnieProperty.features.garden ? 'garden' : 
                   chimnieProperty.features.balcony ? 'balcony_terrace' : 'none',
      imageUrls: chimnieProperty.photos?.map((img: any) => img.url) || [],
      lastValuation: {
        rental_value: chimnieProperty.financials.estimated_rent_pcm,
        confidence_interval: {
          lower: chimnieProperty.financials.estimated_price * 0.9,
          upper: chimnieProperty.financials.estimated_price * 1.1
        },
        property_type: chimnieProperty.basic_info.property_type,
        postcode: chimnieProperty.address.postcode
      },
      lastValuationDate: new Date(chimnieProperty.last_updated || Date.now()),
      chimnieData: chimnieProperty,
      // Additional fields from Chimnie
      councilTaxBand: chimnieProperty.basic_info.council_tax_band,
      epcRating: chimnieProperty.basic_info.epc_rating,
      floorArea: chimnieProperty.basic_info.floor_area_sqm,
      yearBuilt: chimnieProperty.basic_info.year_built,
      tenure: chimnieProperty.basic_info.tenure,
      estimatedYield: chimnieProperty.financials.rental_yield,
      pricePerSqft: chimnieProperty.financials.price_per_sqft,
      lastSoldPrice: chimnieProperty.financials.last_sold_price,
      lastSoldDate: chimnieProperty.financials.last_sold_date
    };
  }

  /**
   * Get API usage statistics
   */
  async getApiUsage(): Promise<{
    requests_this_month: number;
    requests_today: number;
    rate_limit_remaining: number;
    rate_limit_reset: string;
  }> {
    try {
      const response = await this.makeRequest('/usage/stats');
      return response.json();
    } catch (error) {
      console.error('Failed to get Chimnie API usage:', error);
      return {
        requests_this_month: 0,
        requests_today: 0,
        rate_limit_remaining: 1000,
        rate_limit_reset: 'Unknown'
      };
    }
  }
}

// Singleton instance
export const chimnieService = new ChimnieService();
