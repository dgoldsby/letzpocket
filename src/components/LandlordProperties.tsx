import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  MapPin,
  Home,
  Calendar,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { Property } from '../types/property';
import { trackCTAClick, PAGE_NAMES, EVENT_ACTIONS } from '../lib/analytics';

export const LandlordProperties: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [userProperties, userStats] = await Promise.all([
          propertyService.getLandlordProperties(user.uid),
          propertyService.getLandlordStats(user.uid)
        ]);

        setProperties(userProperties);
        setStats(userStats);
        
        trackCTAClick(EVENT_ACTIONS.PROPERTY_VIEW, 'LandlordProperties');
      } catch (err) {
        console.error('Failed to load properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [user]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      await propertyService.deleteProperty(propertyId, user.uid);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_DELETE, 'LandlordProperties');
    } catch (err) {
      console.error('Failed to delete property:', err);
      setError('Failed to delete property. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB').format(date);
  };

  const getPropertyTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view your properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-2">
                Manage your property portfolio and track valuations
              </p>
            </div>
            <Button
              onClick={() => {
                trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_ADD, 'LandlordProperties');
                // Navigate to property form
                window.location.href = '/properties/add';
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalProperties}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.totalValue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(stats.averageRent)}
                  <span className="text-sm text-gray-500 font-normal">/mo</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.propertiesByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {getPropertyTypeDisplay(type)}
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {properties.length === 0 && !loading && !error ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your property portfolio by adding your first property.
              </p>
              <Button
                onClick={() => {
                  trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_ADD, 'LandlordProperties');
                  window.location.href = '/properties/add';
                }}
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {property.address}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {property.postcode}
                        {property.city && `, ${property.city}`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_EDIT, 'LandlordProperties');
                          window.location.href = `/properties/${property.id}/edit`;
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Property Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{getPropertyTypeDisplay(property.property_type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Bedrooms:</span>
                        <span className="font-medium">{property.bedrooms}</span>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Purchase Price:</span>
                        <div className="font-semibold">
                          {property.purchasePrice ? formatCurrency(property.purchasePrice) : 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Value:</span>
                        <div className="font-semibold">
                          {property.currentValue ? formatCurrency(property.currentValue) : 'Valuation pending'}
                        </div>
                      </div>
                    </div>

                    {/* Last Valuation */}
                    {property.lastValuation && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Valuation:</span>
                          <span className="font-medium">
                            {formatCurrency(property.lastValuation.rental_value)}
                            <span className="text-xs text-gray-500">/mo rental value</span>
                          </span>
                        </div>
                        {property.lastValuationDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(property.lastValuationDate)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Images */}
                    {property.imageUrls && property.imageUrls.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Eye className="h-4 w-4" />
                          <span>Property Images</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {property.imageUrls.slice(0, 3).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Property image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-200"
                            />
                          ))}
                          {property.imageUrls.length > 3 && (
                            <div className="flex items-center justify-center text-sm text-gray-500">
                              +{property.imageUrls.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          trackCTAClick(EVENT_ACTIONS.VIEW_ANALYTICS, 'LandlordProperties');
                          window.location.href = `/properties/${property.id}/analytics`;
                        }}
                        className="flex-1"
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Analytics
                      </Button>
                      <Button
                        onClick={() => {
                          trackCTAClick(EVENT_ACTIONS.CALCULATE_YIELD, 'LandlordProperties');
                          window.location.href = `/properties/${property.id}/yield`;
                        }}
                        className="flex-1"
                      >
                        Calculate Yield
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
