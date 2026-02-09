import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Building2, Plus, Edit, Trash2, MapPin, Users, Calendar, PoundSterling, Database, Search, Home, Zap, ChevronDown, ChevronUp, TrendingUp, Zap as ZapIcon, Receipt, Wifi, Home as HomeIcon } from 'lucide-react';
import { propertyService, PropertyFormData } from '../services/propertyService';
import { Property } from '../types/property';
import { useAuth } from '../contexts/AuthContext';

const Properties: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiLoading, setApiLoading] = useState<{ [key: string]: { [api: string]: boolean } }>({});
  const [newProperty, setNewProperty] = useState<Partial<PropertyFormData>>({});
  const [expandedChimnieData, setExpandedChimnieData] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      loadProperties();
    } else {
      setProperties([]);
      setLoading(false);
    }
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProperties = await propertyService.getLandlordProperties(user.uid);
      setProperties(userProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async () => {
    if (!user || !newProperty.address || !newProperty.postcode || !newProperty.city || !newProperty.property_type || !newProperty.bedrooms) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare property data with only defined fields
      const propertyData: PropertyFormData = {
        address: newProperty.address!,
        postcode: newProperty.postcode!,
        city: newProperty.city!,
        property_type: newProperty.property_type!,
        bedrooms: newProperty.bedrooms!
      };
      
      // Only add optional fields if they have values
      if (newProperty.purchasePrice !== undefined) {
        propertyData.purchasePrice = newProperty.purchasePrice;
      }
      if (newProperty.constructionDate) {
        propertyData.constructionDate = newProperty.constructionDate;
      }
      if (newProperty.finishQuality) {
        propertyData.finishQuality = newProperty.finishQuality;
      }
      if (newProperty.outdoorSpace) {
        propertyData.outdoorSpace = newProperty.outdoorSpace;
      }
      if (newProperty.images) {
        propertyData.images = newProperty.images;
      }
      
      console.log('Creating property with data:', propertyData);
      
      // Create property with user's UID as landlordId
      const createdProperty = await propertyService.createProperty(user.uid, propertyData);
      
      // Add to local state
      setProperties(prev => [createdProperty, ...prev]);
      
      // Reset form and close modal
      setNewProperty({});
      setShowAddForm(false);
      
    } catch (error) {
      console.error('Failed to add property - Full error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'No message');
      console.error('Error code:', (error as any)?.code);
      
      // Show more specific error message
      if (error instanceof Error) {
        alert(`Failed to add property: ${error.message}`);
      } else {
        alert('Failed to add property: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (propertyId: string, apiType: 'propertydata' | 'epc' | 'chimnie') => {
    console.log(`🔄 Starting ${apiType} API call for property: ${propertyId}`);
    
    try {
      setApiLoading(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], [apiType]: true }
      }));

      let result;
      console.log(`📡 Calling ${apiType} API...`);
      
      switch (apiType) {
        case 'propertydata':
          result = await propertyService.fetchPropertyData(propertyId);
          break;
        case 'epc':
          result = await propertyService.fetchEPCData(propertyId);
          break;
        case 'chimnie':
          result = await propertyService.fetchChimnieData(propertyId);
          break;
        default:
          result = null;
      }

      console.log(`✅ ${apiType} API result:`, result);

      // Reload properties to show updated data
      await loadProperties();
      console.log(`🔄 Properties reloaded after ${apiType} call`);
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${apiType} data:`, error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to fetch ${apiType} data: ${error.message}`);
      } else {
        alert(`Failed to fetch ${apiType} data: Unknown error occurred`);
      }
    } finally {
      setApiLoading(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], [apiType]: false }
      }));
      console.log(`🏁 Finished ${apiType} API call for property: ${propertyId}`);
    }
  };

  const handleRefreshAll = async (propertyId: string) => {
    try {
      setApiLoading(prev => ({
        ...prev,
        [propertyId]: { propertydata: true, epc: true, chimnie: true }
      }));

      await propertyService.getEnhancedPropertyAnalytics(propertyId);
      await loadProperties();
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    } finally {
      setApiLoading(prev => ({
        ...prev,
        [propertyId]: { propertydata: false, epc: false, chimnie: false }
      }));
    }
  };

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.postcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getApiDataStatus = (property: Property) => {
    const analytics = property.analytics;
    const hasPropertyData = !!analytics.valuation;
    const hasEpcData = !!analytics.epcData;
    const hasChimnieData = !!analytics.chimnieData;
    
    return { hasPropertyData, hasEpcData, hasChimnieData };
  };

  const totalPortfolioValue = properties.reduce((sum, prop) => sum + prop.valuation.estimatedValue, 0);
  const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.rental.currentRent, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Portfolio</h1>
          <p className="text-gray-600 mt-2">
            Manage your rental properties and fetch market data
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Property</span>
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              In your portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <PoundSterling className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total estimated value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <PoundSterling className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRent)}</div>
            <p className="text-xs text-muted-foreground">
              From current rents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search by address or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Properties List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProperties.map((property) => {
          const { hasPropertyData, hasEpcData, hasChimnieData } = getApiDataStatus(property);
          const isLoading = apiLoading[property.id] || {};

          return (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <CardDescription className="flex items-center space-x-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{property.postcode}</span>
                    </CardDescription>
                  </div>
                  <div>
                    {property.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium">{property.property_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Bedrooms:</span>
                      <p className="font-medium">{property.bedrooms}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Rent:</span>
                      <p className="font-medium">{formatCurrency(property.rental.currentRent)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Est. Value:</span>
                      <p className="font-medium">{formatCurrency(property.valuation.estimatedValue)}</p>
                    </div>
                  </div>

                  {/* Estimated Bills (from Chimnie) */}
                  {property.estimatedBills && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm flex items-center">
                          <Receipt className="h-4 w-4 mr-2 text-blue-600" />
                          Estimated Monthly Bills
                        </h4>
                        <span className="text-xs text-gray-500">
                          From Chimnie data
                        </span>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-blue-700">Council Tax:</span>
                            <p className="font-semibold text-blue-900">
                              {formatCurrency(property.estimatedBills.tax)}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700">Energy:</span>
                            <p className="font-semibold text-blue-900">
                              {formatCurrency(property.estimatedBills.energy)}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700">Telecomms:</span>
                            <p className="font-semibold text-blue-900">
                              {formatCurrency(property.estimatedBills.telecomms)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <span className="text-blue-700">Total Monthly Bills:</span>
                          <p className="font-semibold text-blue-900">
                            {formatCurrency(
                              property.estimatedBills.tax +
                              property.estimatedBills.energy +
                              property.estimatedBills.telecomms
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* API Data Status */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Market Data</h4>
                      <span className="text-xs text-gray-500">
                        Last updated: {formatDate(property.analytics.last_updated)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className={`text-center p-2 rounded border ${hasPropertyData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <Database className={`h-4 w-4 mx-auto mb-1 ${hasPropertyData ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-xs font-medium">Property Data</div>
                        <div className="text-xs">{hasPropertyData ? 'Available' : 'Not fetched'}</div>
                      </div>
                      <div className={`text-center p-2 rounded border ${hasEpcData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <Home className={`h-4 w-4 mx-auto mb-1 ${hasEpcData ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-xs font-medium">EPC</div>
                        <div className="text-xs">{hasEpcData ? 'Available' : 'Not fetched'}</div>
                      </div>
                      <div className={`text-center p-2 rounded border ${hasChimnieData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <Zap className={`h-4 w-4 mx-auto mb-1 ${hasChimnieData ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-xs font-medium">Chimnie</div>
                        <div className="text-xs">{hasChimnieData ? 'Available' : 'Not fetched'}</div>
                      </div>
                    </div>

                    {/* Chimnie Data Display */}
                    {hasChimnieData && property.analytics.chimnieData && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-purple-600" />
                            Chimne Market Data
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedChimnieData(prev => ({
                              ...prev,
                              [property.id]: !prev[property.id]
                            }))}
                            className="p-1 h-6 w-6"
                          >
                            {expandedChimnieData[property.id] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {expandedChimnieData[property.id] && (
                          <div className="space-y-3 text-sm">
                            {/* Property Values */}
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Property Values
                              </h5>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="text-purple-700">Sale Value:</span>
                                  <p className="font-semibold text-purple-900">
                                    {formatCurrency(property.analytics.chimnieData.value?.sale || 0)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-purple-700">Rental Value:</span>
                                  <p className="font-semibold text-purple-900">
                                    {formatCurrency(property.analytics.chimnieData.value?.rental || 0)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Bills Information */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                                <Receipt className="h-4 w-4 mr-2" />
                                Estimated Monthly Bills
                              </h5>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <span className="text-blue-700">Council Tax:</span>
                                  <p className="font-semibold text-blue-900">
                                    {formatCurrency(property.analytics.chimnieData.bills?.tax || 0)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-blue-700">Energy:</span>
                                  <p className="font-semibold text-blue-900">
                                    {formatCurrency(property.analytics.chimnieData.bills?.energy || 0)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-blue-700">Telecomms:</span>
                                  <p className="font-semibold text-blue-900">
                                    {formatCurrency(property.analytics.chimnieData.bills?.telecomms || 0)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="text-blue-700">Total Monthly Bills:</span>
                                <p className="font-semibold text-blue-900">
                                  {formatCurrency(
                                    (property.analytics.chimnieData.bills?.tax || 0) +
                                    (property.analytics.chimnieData.bills?.energy || 0) +
                                    (property.analytics.chimnieData.bills?.telecomms || 0)
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Data Source Attribution */}
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span>Data provided by</span>
                                <Badge variant="outline" className="text-xs">
                                  Chimnie API
                                </Badge>
                              </div>
                              <div className="mt-1">
                                Last updated: {formatDate(property.analytics.chimnieData.last_updated)}
                              </div>
                              {property.analytics.chimnieData.dateAdded && (
                                <div>
                                  Added: {formatDate(property.analytics.chimnieData.dateAdded)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* API Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApiCall(property.id, 'propertydata')}
                          disabled={isLoading.propertydata}
                          className="text-xs"
                        >
                          {isLoading.propertydata ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mx-auto" />
                          ) : (
                            <Database className="h-3 w-3 mr-1" />
                          )}
                          Property Data
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApiCall(property.id, 'epc')}
                          disabled={isLoading.epc}
                          className="text-xs"
                        >
                          {isLoading.epc ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600 mx-auto" />
                          ) : (
                            <Home className="h-3 w-3 mr-1" />
                          )}
                          EPC Data
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApiCall(property.id, 'chimnie')}
                          disabled={isLoading.chimnie}
                          className="text-xs"
                        >
                          {isLoading.chimnie ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600 mx-auto" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          Chimnie Data
                        </Button>
                      </div>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRefreshAll(property.id)}
                        disabled={isLoading.propertydata || isLoading.epc || isLoading.chimnie}
                        className="w-full"
                      >
                        {(isLoading.propertydata || isLoading.epc || isLoading.chimnie) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2" />
                        ) : (
                          <Search className="h-3 w-3 mr-2" />
                        )}
                        Fetch All Data
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProperty(property)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* TODO: Implement delete */}}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first property'}
          </p>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Property</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 High Street"
                  value={newProperty.address || ''}
                  onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="SW1A 1AA"
                  value={newProperty.postcode || ''}
                  onChange={(e) => setNewProperty({...newProperty, postcode: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="London"
                  value={newProperty.city || ''}
                  onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <select
                  id="property_type"
                  className="w-full p-2 border rounded-md"
                  value={newProperty.property_type || ''}
                  onChange={(e) => setNewProperty({...newProperty, property_type: e.target.value})}
                >
                  <option value="">Select property type</option>
                  <option value="Detached House">Detached House</option>
                  <option value="Semi-Detached House">Semi-Detached House</option>
                  <option value="Terraced House">Terraced House</option>
                  <option value="Flat">Flat</option>
                  <option value="Bungalow">Bungalow</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  placeholder="3"
                  value={newProperty.bedrooms || ''}
                  onChange={(e) => setNewProperty({...newProperty, bedrooms: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <Label htmlFor="purchasePrice">Purchase Price (optional)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  placeholder="450000"
                  value={newProperty.purchasePrice || ''}
                  onChange={(e) => setNewProperty({...newProperty, purchasePrice: parseInt(e.target.value) || undefined})}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewProperty({});
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProperty}
                disabled={!newProperty.address || !newProperty.postcode || !newProperty.city || !newProperty.property_type || !newProperty.bedrooms}
                className="flex-1"
              >
                Add Property
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
