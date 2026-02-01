import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building2, Plus, Edit, Trash2, MapPin, Users, Calendar, PoundSterling } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  currentValue: number;
  tenants: string;
  leaseExpiry: string;
  status: 'occupied' | 'vacant' | 'maintenance';
}

const Properties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: '1',
      address: '123 High Street',
      postcode: 'SW1A 1AA',
      propertyType: 'Detached House',
      bedrooms: 3,
      bathrooms: 2,
      monthlyRent: 1200,
      currentValue: 450000,
      tenants: 'John Smith',
      leaseExpiry: '2024-06-30',
      status: 'occupied'
    },
    {
      id: '2',
      address: '45 Oak Avenue',
      postcode: 'NW1 2AB',
      propertyType: 'Flat',
      bedrooms: 2,
      bathrooms: 1,
      monthlyRent: 950,
      currentValue: 320000,
      tenants: 'Sarah Johnson',
      leaseExpiry: '2024-12-31',
      status: 'occupied'
    },
    {
      id: '3',
      address: '78 Park Road',
      postcode: 'E1 3CD',
      propertyType: 'Terraced House',
      bedrooms: 4,
      bathrooms: 2,
      monthlyRent: 1600,
      currentValue: 580000,
      tenants: 'Vacant',
      leaseExpiry: '',
      status: 'vacant'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newProperty, setNewProperty] = useState<Omit<Property, 'id'>>({
    address: '',
    postcode: '',
    propertyType: 'Flat',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 0,
    currentValue: 0,
    tenants: '',
    leaseExpiry: '',
    status: 'vacant'
  });

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.postcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProperty = () => {
    const property: Property = {
      ...newProperty,
      id: Date.now().toString()
    };
    setProperties([...properties, property]);
    setNewProperty({
      address: '',
      postcode: '',
      propertyType: 'Flat',
      bedrooms: 1,
      bathrooms: 1,
      monthlyRent: 0,
      currentValue: 0,
      tenants: '',
      leaseExpiry: '',
      status: 'vacant'
    });
    setShowAddForm(false);
  };

  const updateProperty = () => {
    if (!editingProperty) return;
    
    setProperties(properties.map(p => 
      p.id === editingProperty.id ? editingProperty : p
    ));
    setEditingProperty(null);
  };

  const deleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800';
      case 'vacant': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const totalPortfolioValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.monthlyRent, 0);
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Portfolio</h1>
          <p className="text-gray-600 mt-2">
            Manage your rental properties and track their performance
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
            <Building2 className="h-4 w-4 text-lp-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              {occupiedProperties} occupied, {properties.length - occupiedProperties} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <PoundSterling className="h-4 w-4 text-lp-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total current market value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <PoundSterling className="h-4 w-4 text-lp-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRent)}</div>
            <p className="text-xs text-muted-foreground">
              From occupied properties
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
          />
        </div>
      </div>

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Beds/Baths:</span>
                    <p className="font-medium">{property.bedrooms}/{property.bathrooms}</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly Rent:</span>
                      <p className="font-medium">{formatCurrency(property.monthlyRent)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <p className="font-medium">{formatCurrency(property.currentValue)}</p>
                    </div>
                  </div>
                </div>

                {property.status === 'occupied' && (
                  <div className="border-t pt-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-3 w-3 text-gray-600" />
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{property.tenants}</span>
                    </div>
                    {property.leaseExpiry && (
                      <div className="flex items-center space-x-2 text-sm mt-1">
                        <Calendar className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-600">Lease expires:</span>
                        <span className="font-medium">{property.leaseExpiry}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 pt-3">
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
                    onClick={() => deleteProperty(property.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Property Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
              <CardDescription>
                Enter the details for your new rental property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newProperty.address}
                      onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={newProperty.postcode}
                      onChange={(e) => setNewProperty({...newProperty, postcode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={newProperty.bedrooms}
                      onChange={(e) => setNewProperty({...newProperty, bedrooms: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={newProperty.bathrooms}
                      onChange={(e) => setNewProperty({...newProperty, bathrooms: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyRent">Monthly Rent (£)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={newProperty.monthlyRent}
                      onChange={(e) => setNewProperty({...newProperty, monthlyRent: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentValue">Current Value (£)</Label>
                    <Input
                      id="currentValue"
                      type="number"
                      value={newProperty.currentValue}
                      onChange={(e) => setNewProperty({...newProperty, currentValue: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyType">Property Type</Label>
                    <select
                      id="propertyType"
                      value={newProperty.propertyType}
                      onChange={(e) => setNewProperty({...newProperty, propertyType: e.target.value})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Flat">Flat</option>
                      <option value="Detached House">Detached House</option>
                      <option value="Semi-Detached House">Semi-Detached House</option>
                      <option value="Terraced House">Terraced House</option>
                      <option value="Bungalow">Bungalow</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={addProperty} className="flex-1">
                    Add Property
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Property</CardTitle>
              <CardDescription>
                Update the details for {editingProperty.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={editingProperty.address}
                      onChange={(e) => setEditingProperty({...editingProperty, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-postcode">Postcode</Label>
                    <Input
                      id="edit-postcode"
                      value={editingProperty.postcode}
                      onChange={(e) => setEditingProperty({...editingProperty, postcode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                    <Input
                      id="edit-bedrooms"
                      type="number"
                      value={editingProperty.bedrooms}
                      onChange={(e) => setEditingProperty({...editingProperty, bedrooms: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                    <Input
                      id="edit-bathrooms"
                      type="number"
                      value={editingProperty.bathrooms}
                      onChange={(e) => setEditingProperty({...editingProperty, bathrooms: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthlyRent">Monthly Rent (£)</Label>
                    <Input
                      id="edit-monthlyRent"
                      type="number"
                      value={editingProperty.monthlyRent}
                      onChange={(e) => setEditingProperty({...editingProperty, monthlyRent: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-currentValue">Current Value (£)</Label>
                    <Input
                      id="edit-currentValue"
                      type="number"
                      value={editingProperty.currentValue}
                      onChange={(e) => setEditingProperty({...editingProperty, currentValue: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      value={editingProperty.status}
                      onChange={(e) => setEditingProperty({...editingProperty, status: e.target.value as Property['status']})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {editingProperty.status === 'occupied' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-tenants">Tenants</Label>
                      <Input
                        id="edit-tenants"
                        value={editingProperty.tenants}
                        onChange={(e) => setEditingProperty({...editingProperty, tenants: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-leaseExpiry">Lease Expiry</Label>
                      <Input
                        id="edit-leaseExpiry"
                        type="date"
                        value={editingProperty.leaseExpiry}
                        onChange={(e) => setEditingProperty({...editingProperty, leaseExpiry: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button onClick={updateProperty} className="flex-1">
                    Update Property
                  </Button>
                  <Button variant="outline" onClick={() => setEditingProperty(null)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Properties;
