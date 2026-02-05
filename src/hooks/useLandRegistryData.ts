import { useState, useEffect } from 'react';
import { landRegistryService, PostcodeAnalytics, LandRegistryTransaction } from '../services/landRegistry';

export interface UseLandRegistryOptions {
  postcode?: string;
  autoFetch?: boolean;
  limit?: number;
}

export interface ValuationRequest {
  postcode: string;
  propertyType: string;
  bedrooms?: number;
}

export interface UseLandRegistryReturn {
  // Analytics data
  analytics: PostcodeAnalytics | null;
  transactions: LandRegistryTransaction[];
  
  // Valuation data
  valuation: {
    estimatedValue: number;
    confidence: number;
    comparableSales: number;
    lastUpdated: string;
  } | null;
  
  // Loading states
  loading: boolean;
  loadingValuation: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  fetchAnalytics: (postcode: string) => Promise<void>;
  fetchTransactions: (postcode?: string, limit?: number) => Promise<void>;
  getValuation: (request: ValuationRequest) => Promise<void>;
  calculateYield: (propertyPrice: number, monthlyRent: number) => number;
  
  // Utility
  clearData: () => void;
}

export function useLandRegistryData(options: UseLandRegistryOptions = {}): UseLandRegistryReturn {
  const [analytics, setAnalytics] = useState<PostcodeAnalytics | null>(null);
  const [transactions, setTransactions] = useState<LandRegistryTransaction[]>([]);
  const [valuation, setValuation] = useState<UseLandRegistryReturn['valuation']>(null);
  const [loading, setLoading] = useState(false);
  const [loadingValuation, setLoadingValuation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch on mount if postcode is provided
  useEffect(() => {
    if (options.autoFetch && options.postcode) {
      fetchAnalytics(options.postcode);
    }
  }, [options.postcode, options.autoFetch]);

  /**
   * Fetch analytics for a postcode area
   */
  const fetchAnalytics = async (postcode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await landRegistryService.analyzePostcodeArea(postcode);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch raw transaction data
   */
  const fetchTransactions = async (postcode?: string, limit: number = 1000) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await landRegistryService.fetchPricePaidData(postcode, limit);
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get valuation estimate for a property
   */
  const getValuation = async (request: ValuationRequest) => {
    setLoadingValuation(true);
    setError(null);
    
    try {
      const data = await landRegistryService.getValuationEstimate(
        request.postcode,
        request.propertyType,
        request.bedrooms
      );
      setValuation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get valuation';
      setError(errorMessage);
      console.error('Error getting valuation:', err);
    } finally {
      setLoadingValuation(false);
    }
  };

  /**
   * Calculate rental yield
   */
  const calculateYield = (propertyPrice: number, monthlyRent: number): number => {
    return landRegistryService.calculateRentalYield(propertyPrice, monthlyRent);
  };

  /**
   * Clear all data
   */
  const clearData = () => {
    setAnalytics(null);
    setTransactions([]);
    setValuation(null);
    setError(null);
  };

  return {
    analytics,
    transactions,
    valuation,
    loading,
    loadingValuation,
    error,
    fetchAnalytics,
    fetchTransactions,
    getValuation,
    calculateYield,
    clearData
  };
}
