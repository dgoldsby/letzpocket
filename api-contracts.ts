// API Contracts for LetzPocket Backend Services
// These interfaces define the contract between frontend and backend services

// Base Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Management
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  currency: 'GBP' | 'EUR' | 'USD';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

// Property Management
export interface Property {
  id: string;
  userId: string;
  address: string;
  postcode: string;
  propertyType: 'detached' | 'semi-detached' | 'terraced' | 'flat' | 'bungalow' | 'maisonette';
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  yearBuilt?: number;
  currentValue: number;
  purchasePrice?: number;
  purchaseDate?: string;
  monthlyRent: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenants?: TenantInfo[];
  leaseExpiry?: string;
  features: PropertyFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFeatures {
  garden: boolean;
  parking: boolean;
  garage: boolean;
  centralHeating: boolean;
  doubleGlazing: boolean;
  furnished: boolean;
  petsAllowed: boolean;
}

export interface TenantInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  depositAmount: number;
}

// Tenancy Agreement Analysis
export interface AgreementAnalysis {
  id: string;
  userId: string;
  propertyId?: string;
  documentUrl: string;
  documentName: string;
  documentType: 'tenancy-agreement' | 'lease-renewal' | 'section-21' | 'section-8';
  analysisDate: string;
  overallCompliance: 'compliant' | 'needs-attention' | 'non-compliant';
  complianceScore: number;
  issues: ComplianceIssue[];
  recommendations: string[];
  rentersRightsActReferences: string[];
  status: 'processing' | 'completed' | 'failed';
  processingTime?: number;
}

export interface ComplianceIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: 'rent-increase' | 'termination' | 'deposit' | 'repairs' | 'general';
  title: string;
  description: string;
  recommendation: string;
  legalReference: string;
  rentersRightsActSection: string;
  pageReference?: number;
}

export interface AnalysisRequest {
  documentUrl: string;
  documentName: string;
  documentType: string;
  propertyId?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Yield Calculation
export interface YieldCalculation {
  id: string;
  userId: string;
  propertyIds: string[];
  calculationDate: string;
  results: PropertyYieldResult[];
  portfolioMetrics: PortfolioMetrics;
  assumptions: CalculationAssumptions;
}

export interface PropertyYieldResult {
  propertyId: string;
  propertyAddress: string;
  grossYield: number;
  netYield: number;
  annualProfit: number;
  monthlyProfit: number;
  roi: number;
  capitalizationRate: number;
  cashOnCashReturn: number;
  breakEvenOccupancy: number;
}

export interface PortfolioMetrics {
  totalProperties: number;
  totalPropertyValue: number;
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalAnnualExpenses: number;
  totalNetAnnualIncome: number;
  portfolioGrossYield: number;
  portfolioNetYield: number;
  averageRoi: number;
  totalVacancyRate: number;
}

export interface CalculationAssumptions {
  vacancyRate: number;
  managementFeeRate: number;
  maintenanceRate: number;
  insuranceRate: number;
  otherCosts: number;
}

// Property Valuation
export interface PropertyValuation {
  id: string;
  propertyId: string;
  valuationDate: string;
  estimatedValue: number;
  confidenceLevel: number;
  valueRange: {
    min: number;
    max: number;
  };
  pricePerSqFt: number;
  marketData: MarketData;
  comparableProperties: ComparableProperty[];
  valuationMethod: 'automated' | 'comparative' | 'income' | 'hybrid';
  lastUpdated: string;
}

export interface MarketData {
  postcode: string;
  areaName: string;
  averagePrice: number;
  pricePerSqFt: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  priceChangePercent: number;
  daysOnMarket: number;
  rentalYield: number;
}

export interface ComparableProperty {
  address: string;
  distance: number; // in miles
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  salePrice: number;
  saleDate: string;
  pricePerSqFt: number;
  similarity: number; // 0-100
}

export interface ValuationRequest {
  propertyId: string;
  propertyDetails: {
    address: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    features: PropertyFeatures;
  };
  includeComparables?: boolean;
  valuationMethod?: string;
}

// Email Processing
export interface EmailProcessingRequest {
  emailId: string;
  userId?: string;
  processingOptions: {
    extractAttachments: boolean;
    analyzeDocuments: boolean;
    generateResponse: boolean;
    updateProperties: boolean;
  };
}

export interface EmailProcessingResult {
  emailId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedAttachments: ExtractedAttachment[];
  processedDocuments: string[]; // Document IDs
  propertyUpdates: PropertyUpdate[];
  generatedResponse?: string;
  errors?: string[];
  processingTime: number;
}

export interface ExtractedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  documentType?: string;
}

export interface PropertyUpdate {
  propertyId: string;
  field: string;
  oldValue: any;
  newValue: any;
  confidence: number;
}

// API Service Interfaces
export interface PropertyService {
  createProperty(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>>;
  updateProperty(id: string, updates: Partial<Property>): Promise<ApiResponse<Property>>;
  getProperty(id: string): Promise<ApiResponse<Property>>;
  listProperties(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Property>>>;
  deleteProperty(id: string): Promise<ApiResponse<void>>;
  bulkUpdateProperties(updates: Array<{ id: string; updates: Partial<Property> }>): Promise<ApiResponse<Property[]>>;
}

export interface AgreementAnalysisService {
  uploadAgreement(file: File, metadata: AnalysisRequest): Promise<ApiResponse<{ documentId: string }>>;
  analyzeAgreement(documentId: string): Promise<ApiResponse<AgreementAnalysis>>;
  getAnalysis(id: string): Promise<ApiResponse<AgreementAnalysis>>;
  listAnalyses(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<AgreementAnalysis>>>;
  generateReport(analysisId: string, format: 'pdf' | 'json'): Promise<ApiResponse<{ reportUrl: string }>>;
  deleteAnalysis(id: string): Promise<ApiResponse<void>>;
}

export interface YieldCalculationService {
  calculateYield(propertyIds: string[], assumptions?: Partial<CalculationAssumptions>): Promise<ApiResponse<YieldCalculation>>;
  getCalculation(id: string): Promise<ApiResponse<YieldCalculation>>;
  listCalculations(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<YieldCalculation>>>;
  getPortfolioMetrics(userId: string): Promise<ApiResponse<PortfolioMetrics>>;
  getYieldHistory(propertyId: string, period: '1m' | '3m' | '6m' | '1y' | 'all'): Promise<ApiResponse<PropertyYieldResult[]>>;
}

export interface ValuationService {
  estimateValue(request: ValuationRequest): Promise<ApiResponse<PropertyValuation>>;
  getValuation(id: string): Promise<ApiResponse<PropertyValuation>>;
  getMarketData(postcode: string): Promise<ApiResponse<MarketData>>;
  updateValuation(propertyId: string): Promise<ApiResponse<PropertyValuation>>;
  getValuationHistory(propertyId: string): Promise<ApiResponse<PropertyValuation[]>>;
}

export interface EmailProcessingService {
  processEmail(request: EmailProcessingRequest): Promise<ApiResponse<EmailProcessingResult>>;
  getProcessingStatus(emailId: string): Promise<ApiResponse<EmailProcessingResult>>;
  listProcessedEmails(userId: string, params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<EmailProcessingResult>>>;
  configureEmailSettings(userId: string, settings: EmailSettings): Promise<ApiResponse<EmailSettings>>;
}

export interface EmailSettings {
  forwardingAddress: string;
  autoProcess: boolean;
  allowedSenders: string[];
  processingRules: ProcessingRule[];
}

export interface ProcessingRule {
  id: string;
  name: string;
  conditions: {
    senderContains?: string[];
    subjectContains?: string[];
    hasAttachments?: boolean;
  };
  actions: {
    analyzeDocuments: boolean;
    updateProperties: boolean;
    generateResponse: boolean;
    forwardTo?: string;
  };
  enabled: boolean;
}

// Webhook Interfaces for External Integrations
export interface WebhookEvent {
  id: string;
  type: 'property.created' | 'property.updated' | 'analysis.completed' | 'valuation.updated';
  userId: string;
  data: any;
  timestamp: string;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

// Error Types
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Service Factory
export class ApiService {
  constructor(public baseUrl: string, public authToken: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An error occurred',
        data.error?.details
      );
    }

    return data;
  }

  // Generic methods for all services
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
