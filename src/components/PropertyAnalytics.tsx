import React, { useState } from 'react';
import { useLandRegistryData } from '../hooks/useLandRegistryData';
import { Search, TrendingUp, Home, PoundSterling, BarChart3 } from 'lucide-react';

interface PropertyAnalyticsProps {
  className?: string;
}

export function PropertyAnalytics({ className = '' }: PropertyAnalyticsProps) {
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');

  const {
    analytics,
    valuation,
    loading,
    loadingValuation,
    error,
    fetchAnalytics,
    getValuation,
    calculateYield
  } = useLandRegistryData();

  const handleSearchAnalytics = () => {
    if (postcode.trim()) {
      fetchAnalytics(postcode.trim());
    }
  };

  const handleGetValuation = () => {
    if (postcode && propertyType) {
      getValuation({
        postcode: postcode.trim(),
        propertyType,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const rentalYield = valuation && monthlyRent 
    ? calculateYield(valuation.estimatedValue, parseFloat(monthlyRent))
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Property Analytics Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Property Market Analytics
          </h2>
          <div className="text-sm text-gray-500 text-right">
            <div className="font-medium">Data provided by</div>
            <div className="text-blue-600">HM Land Registry</div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-800">
            <BarChart3 className="w-5 h-5" />
            <div>
              <strong>Coming Soon:</strong> HM Land Registry data integration requires backend deployment. 
              This feature will be available once server-side services are implemented.
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode
            </label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g., SW1A, M1, B1"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>
          
          <div className="flex items-end">
            <button
              disabled
              className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Analytics Results */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Market Analysis for {analytics.postcode}
            </h3>
            <div className="text-xs text-gray-500 text-right">
              <div>Source: HM Land Registry</div>
              <div>Price Paid Data</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.analytics.avgPrice)}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.analytics.medianPrice)}
              </div>
              <div className="text-sm text-gray-600">Median Price</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.analytics.transactionCount}
              </div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.analytics.priceRange.min)} - {formatCurrency(analytics.analytics.priceRange.max)}
              </div>
              <div className="text-sm text-gray-600">Price Range</div>
            </div>
          </div>

          {/* Property Types */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Property Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(analytics.propertyTypes).map(([type, data]) => (
                <div key={type} className="bg-gray-50 p-3 rounded-md">
                  <div className="font-medium text-gray-900">{type}</div>
                  <div className="text-sm text-gray-600">{data.count} sales</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.avgPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          {analytics.analytics.monthlyTrend.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Monthly Trend
              </h4>
              <div className="space-y-2">
                {analytics.analytics.monthlyTrend.slice(-6).map((month) => (
                  <div key={month.month} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{month.month}</span>
                    <div className="flex gap-4">
                      <span className="font-medium">{formatCurrency(month.avgPrice)}</span>
                      <span className="text-sm text-gray-500">{month.transactionCount} sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Valuation Calculator */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-600" />
              Property Valuation Calculator
            </h3>
            <div className="text-xs text-gray-500 text-right">
              <div>Based on HM Land Registry</div>
              <div>comparable sales data</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                {Object.keys(analytics.propertyTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms (optional)
              </label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g., 2"
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent (for yield)
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="e.g., 1200"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGetValuation}
                disabled={loadingValuation || !propertyType}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingValuation ? 'Calculating...' : 'Get Valuation'}
              </button>
            </div>
          </div>

          {/* Valuation Results */}
          {valuation && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Estimated Value</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(valuation.estimatedValue)}
                </div>
                <div className="text-sm text-purple-700">
                  Confidence: {valuation.confidence}%
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Comparable Sales</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {valuation.comparableSales}
                </div>
                <div className="text-sm text-blue-700">
                  Properties analyzed
                </div>
              </div>
              
              {monthlyRent && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Rental Yield</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatPercent(rentalYield)}
                  </div>
                  <div className="text-sm text-green-700">
                    Annual return estimate
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Attribution */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Data Source:</strong> HM Land Registry Price Paid Data
          </div>
          <div className="text-right">
            <div>© Crown copyright 2025</div>
            <div className="text-xs text-blue-600">
              Contains public sector information licensed under the Open Government Licence v3.0
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
          <strong>Status:</strong> Feature requires backend implementation to handle API CORS restrictions. 
          Server-side deployment will enable live HM Land Registry data access.
        </div>
      </div>
    </div>
  );
}
