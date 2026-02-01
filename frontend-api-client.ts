// Frontend API Client for LetzPocket
// This client abstracts all API calls and can be easily refactored for different frontend frameworks

import { 
  ApiService, 
  ApiResponse, 
  PaginatedResponse,
  Property,
  AgreementAnalysis,
  YieldCalculation,
  PropertyValuation,
  PropertyService,
  AgreementAnalysisService,
  YieldCalculationService,
  ValuationService,
  EmailProcessingService,
  PropertyUpdate,
  AnalysisRequest,
  ValuationRequest,
  CalculationAssumptions,
  PaginationParams
} from './api-contracts';

class LetzPocketApiClient extends ApiService implements 
  PropertyService,
  AgreementAnalysisService,
  YieldCalculationService,
  ValuationService,
  EmailProcessingService {

  constructor(baseUrl: string = '/api/v1', authToken?: string) {
    super(baseUrl, authToken || '');
  }

  // Authentication
  setAuthToken(token: string) {
    this.authToken = token;
  }

  getAuthToken(): string {
    return this.authToken;
  }

  // Property Service Implementation
  async createProperty(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> {
    return this.post<Property>('/properties', property);
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>> {
    return this.put<Property>(`/properties/${id}`, updates);
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.get<Property>(`/properties/${id}`);
  }

  async listProperties(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Property>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return this.get<PaginatedResponse<Property>>(`/properties/user/${userId}?${query.toString()}`);
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/properties/${id}`);
  }

  async bulkUpdateProperties(updates: Array<{ id: string; updates: Partial<Property> }>): Promise<ApiResponse<Property[]>> {
    return this.post<Property[]>('/properties/bulk-update', { updates });
  }

  // Agreement Analysis Service Implementation
  async uploadAgreement(file: File, metadata: AnalysisRequest): Promise<ApiResponse<{ documentId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${this.baseUrl}/analyses/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data;
  }

  async analyzeAgreement(documentId: string): Promise<ApiResponse<AgreementAnalysis>> {
    return this.post<AgreementAnalysis>('/analyses/analyze', { documentId });
  }

  async getAnalysis(id: string): Promise<ApiResponse<AgreementAnalysis>> {
    return this.get<AgreementAnalysis>(`/analyses/${id}`);
  }

  async listAnalyses(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<AgreementAnalysis>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return this.get<PaginatedResponse<AgreementAnalysis>>(`/analyses/user/${userId}?${query.toString()}`);
  }

  async generateReport(analysisId: string, format: 'pdf' | 'json'): Promise<ApiResponse<{ reportUrl: string }>> {
    return this.post<{ reportUrl: string }>(`/analyses/${analysisId}/report`, { format });
  }

  async deleteAnalysis(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/analyses/${id}`);
  }

  // Yield Calculation Service Implementation
  async calculateYield(propertyIds: string[], assumptions?: Partial<CalculationAssumptions>): Promise<ApiResponse<YieldCalculation>> {
    return this.post<YieldCalculation>('/yield/calculate', { propertyIds, assumptions });
  }

  async getCalculation(id: string): Promise<ApiResponse<YieldCalculation>> {
    return this.get<YieldCalculation>(`/yield/${id}`);
  }

  async listCalculations(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<YieldCalculation>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return this.get<PaginatedResponse<YieldCalculation>>(`/yield/user/${userId}?${query.toString()}`);
  }

  async getPortfolioMetrics(userId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/yield/portfolio/${userId}`);
  }

  async getYieldHistory(propertyId: string, period: '1m' | '3m' | '6m' | '1y' | 'all'): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/yield/property/${propertyId}/history?period=${period}`);
  }

  // Valuation Service Implementation
  async estimateValue(request: ValuationRequest): Promise<ApiResponse<PropertyValuation>> {
    return this.post<PropertyValuation>('/valuations/estimate', request);
  }

  async getValuation(id: string): Promise<ApiResponse<PropertyValuation>> {
    return this.get<PropertyValuation>(`/valuations/${id}`);
  }

  async getMarketData(postcode: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/valuations/market-data/${postcode}`);
  }

  async updateValuation(propertyId: string): Promise<ApiResponse<PropertyValuation>> {
    return this.post<PropertyValuation>(`/valuations/update/${propertyId}`, {});
  }

  async getValuationHistory(propertyId: string): Promise<ApiResponse<PropertyValuation[]>> {
    return this.get<PropertyValuation[]>(`/valuations/property/${propertyId}/history`);
  }

  // Email Processing Service Implementation
  async processEmail(request: any): Promise<ApiResponse<any>> {
    return this.post<any>('/email/process', request);
  }

  async getProcessingStatus(emailId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/email/status/${emailId}`);
  }

  async listProcessedEmails(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return this.get<PaginatedResponse<any>>(`/email/user/${userId}?${query.toString()}`);
  }

  async configureEmailSettings(userId: string, settings: any): Promise<ApiResponse<any>> {
    return this.post<any>(`/email/settings/${userId}`, settings);
  }

  // User Management
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.get<any>('/user/profile');
  }

  async updateUserProfile(updates: any): Promise<ApiResponse<any>> {
    return this.put<any>('/user/profile', updates);
  }

  async getUserPreferences(): Promise<ApiResponse<any>> {
    return this.get<any>('/user/preferences');
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.put<any>('/user/preferences', preferences);
  }

  // Dashboard Analytics
  async getDashboardData(userId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/dashboard/${userId}`);
  }

  async getRecentActivity(userId: string, limit?: number): Promise<ApiResponse<any[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.get<any[]>(`/dashboard/${userId}/activity${query}`);
  }

  // File Upload Helper
  async uploadFile(file: File, type: 'agreement' | 'property-image' | 'document'): Promise<ApiResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data;
  }

  // Search and Filtering
  async searchProperties(query: string, filters?: any): Promise<ApiResponse<Property[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
    }

    return this.get<Property[]>(`/properties/search?${searchParams.toString()}`);
  }

  async getAnalyticsData(userId: string, period: 'week' | 'month' | 'quarter' | 'year'): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/${userId}?period=${period}`);
  }

  // Webhook Management
  async createWebhook(webhook: any): Promise<ApiResponse<any>> {
    return this.post<any>('/webhooks', webhook);
  }

  async getWebhooks(userId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/webhooks/user/${userId}`);
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/webhooks/${webhookId}`);
  }
}

// React Hook for API Integration
import { useState, useEffect, useCallback } from 'react';

export function useLetzPocketApi(authToken?: string) {
  const [api] = useState(() => new LetzPocketApiClient('/api/v1', authToken));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRequest = useCallback(async <T>(
    requestFunction: () => Promise<ApiResponse<T>>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestFunction();
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Request failed');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    api,
    loading,
    error,
    executeRequest,
    clearError: () => setError(null),
  };
}

// Specific React Hooks for Common Operations
export function useProperties(userId: string) {
  const { api, loading, error, executeRequest } = useLetzPocketApi();
  const [properties, setProperties] = useState<Property[]>([]);

  const loadProperties = useCallback(async () => {
    const result = await executeRequest(() => api.listProperties(userId));
    if (result) {
      setProperties(result.items);
    }
  }, [api, userId, executeRequest]);

  const createProperty = useCallback(async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await executeRequest(() => api.createProperty(property));
    if (result) {
      setProperties(prev => [...prev, result]);
      return result;
    }
    return null;
  }, [api, executeRequest]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    const result = await executeRequest(() => api.updateProperty(id, updates));
    if (result) {
      setProperties(prev => prev.map(p => p.id === id ? result : p));
      return result;
    }
    return null;
  }, [api, executeRequest]);

  const deleteProperty = useCallback(async (id: string) => {
    const success = await executeRequest(() => api.deleteProperty(id));
    if (success !== null) {
      setProperties(prev => prev.filter(p => p.id !== id));
      return true;
    }
    return false;
  }, [api, executeRequest]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return {
    properties,
    loading,
    error,
    loadProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}

export function useAgreementAnalyses(userId: string) {
  const { api, loading, error, executeRequest } = useLetzPocketApi();
  const [analyses, setAnalyses] = useState<AgreementAnalysis[]>([]);

  const loadAnalyses = useCallback(async () => {
    const result = await executeRequest(() => api.listAnalyses(userId));
    if (result) {
      setAnalyses(result.items);
    }
  }, [api, userId, executeRequest]);

  const uploadAndAnalyze = useCallback(async (file: File, metadata: AnalysisRequest) => {
    const uploadResult = await executeRequest(() => api.uploadAgreement(file, metadata));
    if (uploadResult) {
      const analysisResult = await executeRequest(() => api.analyzeAgreement(uploadResult.documentId));
      if (analysisResult) {
        setAnalyses(prev => [analysisResult, ...prev]);
        return analysisResult;
      }
    }
    return null;
  }, [api, executeRequest]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return {
    analyses,
    loading,
    error,
    loadAnalyses,
    uploadAndAnalyze,
  };
}

export default LetzPocketApiClient;
