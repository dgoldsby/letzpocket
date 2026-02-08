import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Building, 
  Upload, 
  MapPin, 
  Home, 
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { propertyService, PropertyFormData } from '../services/propertyService';
import { trackCTAClick, trackFormInteraction, trackError, EVENT_CATEGORIES, EVENT_ACTIONS } from '../lib/analytics';

interface PropertyFormProps {
  property?: any; // For editing existing property
  onSave?: (property: any) => void;
  onCancel?: () => void;
}

const PROPERTY_TYPES = [
  'flat',
  'detached_house',
  'terraced_house',
  'semi_detached_house',
  'bungalow',
  'maisonette'
];

const CONSTRUCTION_DATES = [
  { value: 'pre_1914', label: 'Pre-1914' },
  { value: '1914_2000', label: '1914-2000' },
  { value: '2000_onwards', label: '2000 onwards' }
];

const FINISH_QUALITIES = [
  { value: 'very_high', label: 'Very High' },
  { value: 'high', label: 'High' },
  { value: 'average', label: 'Average' },
  { value: 'below_average', label: 'Below Average' },
  { value: 'unmodernised', label: 'Unmodernised' }
];

const OUTDOOR_SPACES = [
  { value: 'none', label: 'None' },
  { value: 'balcony_terrace', label: 'Balcony/Terrace' },
  { value: 'garden', label: 'Garden' },
  { value: 'garden_very_large', label: 'Very Large Garden' }
];

export const PropertyForm: React.FC<PropertyFormProps> = ({ 
  property, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<PropertyFormData>({
    address: property?.address || '',
    postcode: property?.postcode || '',
    city: property?.city || '',
    property_type: property?.property_type || '',
    bedrooms: property?.bedrooms || 1,
    purchasePrice: property?.purchasePrice || undefined,
    constructionDate: property?.constructionDate || '',
    finishQuality: property?.finishQuality || '',
    outdoorSpace: property?.outdoorSpace || '',
    images: []
  });

  // Image upload state
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (property?.imageUrls) {
      setImagePreviews(property.imageUrls);
    }
  }, [property]);

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      trackError('image_validation', 'Some images were invalid (must be images under 5MB)');
      setErrors(prev => ({ 
        ...prev, 
        images: 'Only image files under 5MB are allowed' 
      }));
      return;
    }

    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
    
    // Update form data
    setFormData(prev => ({ 
      ...prev, 
      images: [...(prev.images || []), ...validFiles] 
    }));
    
    // Clear image error
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.address.trim()) {
      newErrors.address = 'Property address is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(formData.postcode.replace(/\s/g, ''))) {
      newErrors.postcode = 'Invalid UK postcode format';
    }

    if (!formData.property_type) {
      newErrors.property_type = 'Property type is required';
    }

    if (!formData.bedrooms || formData.bedrooms < 1 || formData.bedrooms > 20) {
      newErrors.bedrooms = 'Number of bedrooms must be between 1 and 20';
    }

    if (formData.purchasePrice && (formData.purchasePrice < 1000 || formData.purchasePrice > 10000000)) {
      newErrors.purchasePrice = 'Purchase price must be between £1,000 and £10,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      trackError('auth_required', 'User must be logged in to add property');
      return;
    }

    if (!validateForm()) {
      trackFormInteraction('property_form_validation_failed', 'Property form validation failed');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      trackFormInteraction('property_form_submit', 'Property form submitted');

      let savedProperty;
      if (property?.id) {
        // Update existing property
        savedProperty = await propertyService.updateProperty(property.id, user.uid, formData);
        trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_EDIT, 'PropertyForm');
      } else {
        // Create new property
        savedProperty = await propertyService.createProperty(user.uid, formData);
        trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_ADD, 'PropertyForm');
      }

      setSuccess(true);
      trackFormInteraction('property_form_success', 'Property saved successfully');

      // Call onSave callback if provided
      if (onSave) {
        onSave(savedProperty);
      }

      // Reset form for new properties
      if (!property?.id) {
        setFormData({
          address: '',
          postcode: '',
          city: '',
          property_type: '',
          bedrooms: 1,
          purchasePrice: undefined,
          constructionDate: '',
          finishQuality: '',
          outdoorSpace: '',
          images: []
        });
        setImagePreviews([]);
      }

    } catch (error) {
      console.error('Failed to save property:', error);
      trackError('property_save_failed', error instanceof Error ? error.message : 'Unknown error');
      setErrors(prev => ({ 
        ...prev, 
        submit: 'Failed to save property. Please try again.' 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    trackCTAClick(EVENT_ACTIONS.CTA_PROPERTY_CANCEL, 'PropertyForm');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {property?.id ? 'Edit Property' : 'Add New Property'}
          </CardTitle>
          <CardDescription>
            {property?.id 
              ? 'Update property details and get accurate valuations'
              : 'Add a property to your portfolio and get instant valuations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Property {property?.id ? 'updated' : 'added'} successfully!
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main Street, London"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  type="text"
                  placeholder="SW1A 1AA"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value.toUpperCase())}
                  className={errors.postcode ? 'border-red-500' : ''}
                />
                {errors.postcode && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.postcode}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                type="text"
                placeholder="London"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <select
                  id="property_type"
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className={`w-full p-2 border border-gray-300 rounded-md ${errors.property_type ? 'border-red-500' : ''}`}
                >
                  <option value="">Select property type</option>
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                    </option>
                  ))}
                </select>
                {errors.property_type && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.property_type}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 1)}
                  className={errors.bedrooms ? 'border-red-500' : ''}
                />
                {errors.bedrooms && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.bedrooms}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (Optional)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="1000"
                  max="10000000"
                  step="1000"
                  placeholder="250000"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={errors.purchasePrice ? 'border-red-500' : ''}
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.purchasePrice}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Details for Valuation */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Additional Details (for more accurate valuations)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="constructionDate">Construction Period</Label>
                  <select
                    id="constructionDate"
                    value={formData.constructionDate}
                    onChange={(e) => handleInputChange('constructionDate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select construction period</option>
                    {CONSTRUCTION_DATES.map(date => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finishQuality">Interior Finish</Label>
                  <select
                    id="finishQuality"
                    value={formData.finishQuality}
                    onChange={(e) => handleInputChange('finishQuality', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select finish quality</option>
                    {FINISH_QUALITIES.map(quality => (
                      <option key={quality.value} value={quality.value}>
                        {quality.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outdoorSpace">Outdoor Space</Label>
                  <select
                    id="outdoorSpace"
                    value={formData.outdoorSpace}
                    onChange={(e) => handleInputChange('outdoorSpace', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select outdoor space</option>
                    {OUTDOOR_SPACES.map(space => (
                      <option key={space.value} value={space.value}>
                        {space.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <Label>Property Images (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 mb-4">
                    <p>Click to upload or drag and drop</p>
                    <p className="text-xs">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImages}
                    className="mb-4"
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Images
                      </>
                    )}
                  </Button>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImages}
                className="min-w-32"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {property?.id ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    {property?.id ? 'Update Property' : 'Add Property'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
