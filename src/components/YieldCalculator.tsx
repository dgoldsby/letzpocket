import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calculator, TrendingUp, Home, PoundSterling } from 'lucide-react';

interface Property {
  propertyValue: string;
  monthlyRent: string;
  annualCosts: string;
  vacancyRate: string;
}

interface YieldResult {
  grossYield: number;
  netYield: number;
  annualProfit: number;
  monthlyProfit: number;
  roi: number;
}

const YieldCalculator: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([
    { propertyValue: '', monthlyRent: '', annualCosts: '', vacancyRate: '5' }
  ]);
  const [results, setResults] = useState<YieldResult[]>([]);

  const addProperty = () => {
    setProperties([...properties, { propertyValue: '', monthlyRent: '', annualCosts: '', vacancyRate: '5' }]);
  };

  const removeProperty = (index: number) => {
    const newProperties = properties.filter((_, i) => i !== index);
    setProperties(newProperties.length > 0 ? newProperties : [{ propertyValue: '', monthlyRent: '', annualCosts: '', vacancyRate: '5' }]);
  };

  const updateProperty = (index: number, field: keyof Property, value: string) => {
    const newProperties = [...properties];
    newProperties[index] = { ...newProperties[index], [field]: value };
    setProperties(newProperties);
  };

  const calculateYield = () => {
    const newResults: YieldResult[] = properties.map(property => {
      const propertyValue = parseFloat(property.propertyValue) || 0;
      const monthlyRent = parseFloat(property.monthlyRent) || 0;
      const annualCosts = parseFloat(property.annualCosts) || 0;
      const vacancyRate = (parseFloat(property.vacancyRate) || 5) / 100;

      const annualRent = monthlyRent * 12;
      const effectiveAnnualRent = annualRent * (1 - vacancyRate);
      const grossYield = propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0;
      const netYield = propertyValue > 0 ? ((effectiveAnnualRent - annualCosts) / propertyValue) * 100 : 0;
      const annualProfit = effectiveAnnualRent - annualCosts;
      const monthlyProfit = annualProfit / 12;
      const roi = annualCosts > 0 ? (annualProfit / annualCosts) * 100 : 0;

      return {
        icon: TrendingUp,
        color: 'text-lp-orange-600',
        grossYield,
        netYield,
        annualProfit,
        monthlyProfit,
        roi
      };
    });

    setResults(newResults);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTotalPortfolioStats = () => {
    if (results.length === 0) return null;
    
    const totalPropertyValue = properties.reduce((sum, prop) => sum + (parseFloat(prop.propertyValue) || 0), 0);
    const totalAnnualProfit = results.reduce((sum, result) => sum + result.annualProfit, 0);
    const totalMonthlyProfit = results.reduce((sum, result) => sum + result.monthlyProfit, 0);
    const averageNetYield = results.reduce((sum, result) => sum + result.netYield, 0) / results.length;

    return {
      totalPropertyValue,
      totalAnnualProfit,
      totalMonthlyProfit,
      averageNetYield
    };
  };

  const portfolioStats = getTotalPortfolioStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rental Yield Calculator</h1>
        <p className="text-gray-600 mt-2">
          Calculate the rental yield and profitability of your properties
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Property Details</span>
          </CardTitle>
          <CardDescription>
            Enter the details for each property to calculate rental yield
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {properties.map((property, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Property {index + 1}</h3>
                  {properties.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProperty(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`property-value-${index}`}>Property Value (£)</Label>
                    <Input
                      id={`property-value-${index}`}
                      type="number"
                      placeholder="250000"
                      value={property.propertyValue}
                      onChange={(e) => updateProperty(index, 'propertyValue', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`monthly-rent-${index}`}>Monthly Rent (£)</Label>
                    <Input
                      id={`monthly-rent-${index}`}
                      type="number"
                      placeholder="1200"
                      value={property.monthlyRent}
                      onChange={(e) => updateProperty(index, 'monthlyRent', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`annual-costs-${index}`}>Annual Costs (£)</Label>
                    <Input
                      id={`annual-costs-${index}`}
                      type="number"
                      placeholder="3000"
                      value={property.annualCosts}
                      onChange={(e) => updateProperty(index, 'annualCosts', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Insurance, maintenance, management fees, etc.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`vacancy-rate-${index}`}>Vacancy Rate (%)</Label>
                    <Input
                      id={`vacancy-rate-${index}`}
                      type="number"
                      placeholder="5"
                      value={property.vacancyRate}
                      onChange={(e) => updateProperty(index, 'vacancyRate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Expected vacancy percentage
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addProperty} className="w-full">
              Add Another Property
            </Button>
            
            <Button onClick={calculateYield} className="w-full">
              Calculate Yield
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          {portfolioStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Portfolio Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(portfolioStats.totalPropertyValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Annual Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(portfolioStats.totalAnnualProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Monthly Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(portfolioStats.totalMonthlyProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Net Yield</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(portfolioStats.averageNetYield)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Property Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Individual Property Results</h3>
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5" />
                    <span>Property {index + 1}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gross Yield</p>
                      <p className="text-xl font-bold text-lp-blue-600">
                        {formatPercentage(result.grossYield)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Yield</p>
                      <p className="text-xl font-bold text-lp-orange-600">
                        {formatPercentage(result.netYield)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Annual Profit</p>
                      <p className="text-xl font-bold">
                        <span className={result.annualProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(result.annualProfit)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Profit</p>
                      <p className="text-xl font-bold">
                        <span className={result.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(result.monthlyProfit)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">ROI</p>
                      <p className="text-xl font-bold text-lp-blue-600">
                        {formatPercentage(result.roi)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Performance Indicator */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <PoundSterling className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        {result.netYield >= 5 
                          ? 'Good yield - above the UK average of 4-5%'
                          : result.netYield >= 3
                          ? 'Moderate yield - consider ways to increase rental income or reduce costs'
                          : 'Low yield - review your strategy for this property'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Yield Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-lp-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Target 5-8% Net Yield</p>
                    <p className="text-sm text-gray-600">
                      A healthy rental property typically achieves 5-8% net yield after all costs
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-lp-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Consider Vacancy Rates</p>
                    <p className="text-sm text-gray-600">
                      Factor in 5-10% vacancy rate for realistic projections
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-lp-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Include All Costs</p>
                    <p className="text-sm text-gray-600">
                      Don't forget insurance, maintenance, management fees, and void periods
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default YieldCalculator;
