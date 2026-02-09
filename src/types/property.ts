// Property-related type definitions for LetzPocket

export interface Property {
  id: string;
  address: string;
  postcode: string;
  city?: string;
  property_type: string;
  bedrooms: number;
  purchasePrice?: number;
  constructionDate?: string;
  finishQuality?: string;
  outdoorSpace?: string;
  images?: string[];
  landlordId: string;
  status: 'active' | 'inactive' | 'archived';
  rental: {
    currentRent: number;
    marketRent: number;
    lastReview: Date;
    nextReview: Date;
  };
  valuation: {
    estimatedValue: number;
    lastUpdated: Date;
    confidence: 'low' | 'medium' | 'high';
  };
  estimatedBills?: {
    tax: number;
    energy: number;
    telecomms: number;
  };
  analytics: PropertyAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyAnalytics {
  postcode: string;
  last_updated: Date;
  valuation: any;
  rental: any;
  marketTrends: any;
  comparableProperties: any;
  epcData: any;
  chimnieData: any;
  errors: Array<{
    type: string;
    error: string;
  }>;
}

export interface ValuationData {
  rental_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  property_type: string;
  postcode: string;
  radius?: number;
}

export interface RentalMarketData {
  average_rent: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  sample_size: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

export interface SoldPricesData {
  average_price: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  sample_size: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

export interface DemographicsData {
  population: number;
  average_age: number;
  household_income: number;
  employment_rate: number;
  sample_from_town_center?: boolean;
}

export interface GrowthData {
  yearly_growth: number[];
  five_year_growth: number;
  postcode: string;
  sample_from_town_center?: boolean;
}

export interface PropertyDataCache {
  id: string;
  propertyId?: string;
  postcode: string;
  dataType: string;
  apiResponse: any;
  cachedAt: Date;
  expiresAt: Date;
  apiCostCredits: number;
}

export interface ApiUsageLog {
  id: string;
  userId: string;
  endpoint: string;
  creditsUsed: number;
  requestParams: any;
  responseStatus: string;
  createdAt: Date;
}

export interface PropertyValueHistory {
  id: string;
  propertyId: string;
  value: number;
  date: Date;
  source: string;
}

export interface UserApiQuota {
  userId: string;
  monthlyCredits: number;
  usedCredits: number;
  resetDate: Date;
  plan: 'free' | 'professional' | 'enterprise';
}
