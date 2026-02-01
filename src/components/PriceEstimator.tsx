import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TrendingUp, Home, MapPin, Square, Calendar, Info } from 'lucide-react';

interface PropertyDetails {
  postcode: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  yearBuilt: string;
  condition: string;
  garden: boolean;
  parking: boolean;
  garage: boolean;
}

interface PriceEstimate {
  estimatedValue: number;
  priceRange: {
    min: number;
    max: number;
  };
  pricePerSqFt: number;
  confidence: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  localAverage: number;
  lastUpdated: string;
}

const PriceEstimator: React.FC = () => {
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    postcode: '',
    propertyType: 'detached',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    yearBuilt: '',
    condition: 'good',
    garden: false,
    parking: false,
    garage: false,
  });

  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const propertyTypes = [
    { value: 'detached', label: 'Detached House' },
    { value: 'semi-detached', label: 'Semi-Detached House' },
    { value: 'terraced', label: 'Terraced House' },
    { value: 'flat', label: 'Flat/Apartment' },
    { value: 'bungalow', label: 'Bungalow' },
    { value: 'maisonette', label: 'Maisonette' },
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const handleInputChange = (field: keyof PropertyDetails, value: string | boolean) => {
    setPropertyDetails(prev => ({ ...prev, [field]: value }));
  };

  const calculateEstimate = async () => {
    setIsCalculating(true);
    
    // Simulate API call for price estimation
    setTimeout(() => {
      const baseValue = 250000; // Base value for calculation
      const bedroomMultiplier = parseInt(propertyDetails.bedrooms) || 1;
      const sqFtMultiplier = (parseInt(propertyDetails.squareFootage) || 1000) / 1000;
      const conditionMultiplier = {
        excellent: 1.2,
        good: 1.0,
        fair: 0.85,
        poor: 0.7,
      }[propertyDetails.condition] || 1.0;
      
      const propertyTypeMultiplier = {
        detached: 1.3,
        'semi-detached': 1.1,
        terraced: 0.9,
        flat: 0.8,
        bungalow: 1.15,
        maisonette: 0.85,
      }[propertyDetails.propertyType] || 1.0;
      
      const featuresMultiplier = 1 + 
        (propertyDetails.garden ? 0.05 : 0) +
        (propertyDetails.parking ? 0.03 : 0) +
        (propertyDetails.garage ? 0.04 : 0);
      
      const estimatedValue = Math.round(
        baseValue * 
        bedroomMultiplier * 
        sqFtMultiplier * 
        conditionMultiplier * 
        propertyTypeMultiplier * 
        featuresMultiplier
      );
      
      const mockEstimate: PriceEstimate = {
        estimatedValue,
        priceRange: {
          min: Math.round(estimatedValue * 0.9),
          max: Math.round(estimatedValue * 1.1),
        },
        pricePerSqFt: Math.round(estimatedValue / (parseInt(propertyDetails.squareFootage) || 1000)),
        confidence: 85,
        marketTrend: 'rising',
        localAverage: Math.round(estimatedValue * 0.95),
        lastUpdated: new Date().toLocaleDateString(),
      };
      
      setEstimate(mockEstimate);
      setIsCalculating(false);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable':
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600';
      case 'stable': return 'text-gray-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">House Price Estimator</h1>
        <p className="text-gray-600 mt-2">
          Get an estimated market value for your property based on current UK market data
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Property Details</span>
          </CardTitle>
          <CardDescription>
            Enter your property details to get an accurate price estimate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Location */}
            <div>
              <Label htmlFor="postcode" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Postcode</span>
              </Label>
              <Input
                id="postcode"
                placeholder="SW1A 1AA"
                value={propertyDetails.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Property Type */}
            <div>
              <Label htmlFor="property-type">Property Type</Label>
              <select
                id="property-type"
                value={propertyDetails.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  placeholder="3"
                  value={propertyDetails.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="2"
                  value={propertyDetails.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                />
              </div>
            </div>

            {/* Size and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="square-footage" className="flex items-center space-x-2">
                  <Square className="h-4 w-4" />
                  <span>Square Footage</span>
                </Label>
                <Input
                  id="square-footage"
                  type="number"
                  placeholder="1200"
                  value={propertyDetails.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="year-built" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Year Built</span>
                </Label>
                <Input
                  id="year-built"
                  type="number"
                  placeholder="2000"
                  value={propertyDetails.yearBuilt}
                  onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <Label htmlFor="condition">Property Condition</Label>
              <select
                id="condition"
                value={propertyDetails.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Features */}
            <div>
              <Label className="text-base font-medium">Features</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={propertyDetails.garden}
                    onChange={(e) => handleInputChange('garden', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Garden</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={propertyDetails.parking}
                    onChange={(e) => handleInputChange('parking', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Parking Space</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={propertyDetails.garage}
                    onChange={(e) => handleInputChange('garage', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Garage</span>
                </label>
              </div>
            </div>

            <Button 
              onClick={calculateEstimate} 
              disabled={isCalculating || !propertyDetails.postcode || !propertyDetails.bedrooms}
              className="w-full"
            >
              {isCalculating ? 'Calculating...' : 'Get Price Estimate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {estimate && (
        <div className="space-y-6">
          {/* Main Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Estimated Property Value</span>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(estimate.marketTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(estimate.marketTrend)}`}>
                    Market {estimate.marketTrend}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                Based on current market data and property characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">
                  {formatCurrency(estimate.estimatedValue)}
                </p>
                <p className="text-gray-600 mt-2">
                  Range: {formatCurrency(estimate.priceRange.min)} - {formatCurrency(estimate.priceRange.max)}
                </p>
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold">{estimate.confidence}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Price per sq ft</p>
                    <p className="text-lg font-semibold">{formatCurrency(estimate.pricePerSqFt)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Local Average</p>
                    <p className="text-lg font-semibold">{formatCurrency(estimate.localAverage)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Market Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Property Value vs Local Average</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {estimate.estimatedValue > estimate.localAverage 
                        ? `Your property is estimated to be ${formatCurrency(estimate.estimatedValue - estimate.localAverage)} above the local average`
                        : `Your property is estimated to be ${formatCurrency(estimate.localAverage - estimate.estimatedValue)} below the local average`
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Market Trend</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      The local market is currently {estimate.marketTrend}, which may affect your property's value over the coming months.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Factors Affecting Your Estimate</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Property condition: {propertyDetails.condition}</li>
                    <li>• Number of bedrooms: {propertyDetails.bedrooms}</li>
                    <li>• Square footage: {propertyDetails.squareFootage} sq ft</li>
                    <li>• Additional features: {[propertyDetails.garden && 'garden', propertyDetails.parking && 'parking', propertyDetails.garage && 'garage'].filter(Boolean).join(', ') || 'none'}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Important Information</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    This is an automated estimate based on available market data and should not be considered a formal valuation. 
                    For accurate property valuation, please consult with a qualified RICS surveyor or local estate agent. 
                    Actual sale prices may vary based on market conditions, buyer demand, and specific property features.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {estimate.lastUpdated}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PriceEstimator;
