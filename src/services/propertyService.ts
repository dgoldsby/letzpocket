import { 
  Property, 
  PropertyAnalytics, 
  PropertyValueHistory,
  PropertyDataCache 
} from '../types/property';
import firebaseService from './firebaseService';
import { propertyDataService } from './propertyData';
import { chimnieService, ChimnieProperty } from './chimnieService';

export interface PropertyFormData {
  address: string;
  postcode: string;
  city?: string;
  property_type: string;
  bedrooms: number;
  purchasePrice?: number;
  constructionDate?: string;
  finishQuality?: string;
  outdoorSpace?: string;
  images?: File[];
}

export interface PropertyValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

export class PropertyService {
  private readonly COLLECTION_NAME = 'properties';
  private readonly CACHE_COLLECTION = 'property_data_cache';
  private readonly HISTORY_COLLECTION = 'property_value_history';

  /**
   * Create a new property for a landlord
   */
  async createProperty(userId: string, propertyData: PropertyFormData): Promise<Property> {
    // Validate property data
    const validation = this.validatePropertyData(propertyData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (propertyData.images && propertyData.images.length > 0) {
      imageUrls = await this.uploadPropertyImages(propertyData.images);
    }

    // Create property document
    const property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
      address: propertyData.address,
      postcode: propertyData.postcode.toUpperCase().replace(/\s/g, ''),
      city: propertyData.city,
      property_type: propertyData.property_type,
      bedrooms: propertyData.bedrooms,
      purchasePrice: propertyData.purchasePrice,
      constructionDate: propertyData.constructionDate,
      finishQuality: propertyData.finishQuality,
      outdoorSpace: propertyData.outdoorSpace,
      userId,
      imageUrls
    };

    const docRef = await firebaseService.addDocument(this.COLLECTION_NAME, property);
    
    // Get initial valuation if we have enough data
    if (this.hasEnoughDataForValuation(propertyData)) {
      try {
        await this.getAndStorePropertyValuation(docRef.id, propertyData);
      } catch (error) {
        console.warn('Initial valuation failed:', error);
        // Don't fail property creation if valuation fails
      }
    }

    return {
      id: docRef.id,
      ...property,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Property;
  }

  /**
   * Get all properties for a landlord
   */
  async getLandlordProperties(userId: string): Promise<Property[]> {
    const properties = await firebaseService.getDocuments<Property>(
      this.COLLECTION_NAME,
      [['userId', '==', userId]]
    );
    
    return properties.map((doc: any) => ({
      ...doc,
      createdAt: doc.createdAt?.toDate() || new Date(),
      updatedAt: doc.updatedAt?.toDate() || new Date()
    }));
  }

  /**
   * Get a single property by ID
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    const property = await firebaseService.getDocument<Property>(
      this.COLLECTION_NAME,
      propertyId
    );
    
    if (!property) return null;
    
    return {
      ...property,
      createdAt: property.createdAt?.toDate() || new Date(),
      updatedAt: property.updatedAt?.toDate() || new Date()
    };
  }

  /**
   * Update property details
   */
  async updateProperty(propertyId: string, userId: string, updates: Partial<PropertyFormData>): Promise<Property> {
    // Validate updates
    const validation = this.validatePropertyData(updates as PropertyFormData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Handle image uploads
    let imageUrls: string[] = [];
    if (updates.images && updates.images.length > 0) {
      imageUrls = await this.uploadPropertyImages(updates.images);
    }

    const updateData: Partial<Property> = {
      ...updates,
      postcode: updates.postcode?.toUpperCase().replace(/\s/g, ''),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      updatedAt: new Date()
    };

    await firebaseService.updateDocument(this.COLLECTION_NAME, propertyId, updateData);

    // Get new valuation if property details changed significantly
    if (this.shouldRefreshValuation(updates)) {
      try {
        const currentProperty = await this.getProperty(propertyId);
        if (currentProperty) {
          await this.getAndStorePropertyValuation(propertyId, {
            ...currentProperty,
            ...updates
          } as PropertyFormData);
        }
      } catch (error) {
        console.warn('Valuation update failed:', error);
      }
    }

    const updatedProperty = await this.getProperty(propertyId);
    if (!updatedProperty) {
      throw new Error('Property not found after update');
    }

    return updatedProperty;
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    // Verify ownership
    const property = await this.getProperty(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.userId !== userId) {
      throw new Error('Not authorized to delete this property');
    }

    // Delete associated images from storage
    if (property.imageUrls && property.imageUrls.length > 0) {
      await this.deletePropertyImages(property.imageUrls);
    }

    // Delete property document
    await firebaseService.deleteDocument(this.COLLECTION_NAME, propertyId);

    // Delete cached data
    await this.deletePropertyCache(propertyId);
  }

  /**
   * Get comprehensive property analytics including cached data
   */
  async getPropertyAnalytics(propertyId: string): Promise<PropertyAnalytics> {
    const property = await this.getProperty(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    try {
      // Get PropertyData analytics
      const analytics = await propertyDataService.getPropertyAnalytics(
        property.postcode,
        {
          property_type: property.property_type,
          bedrooms: property.bedrooms,
          construction_date: property.constructionDate,
          finish_quality: property.finishQuality,
          outdoor_space: property.outdoorSpace
        }
      );

      return {
        postcode: property.postcode,
        last_updated: new Date(),
        ...analytics
      };
    } catch (error) {
      console.error('Failed to get property analytics:', error);
      return {
        postcode: property.postcode,
        last_updated: new Date(),
        valuation: null,
        rental_market: null,
        sold_prices: null,
        growth: null,
        demographics: null,
        errors: [{
          type: 'analytics_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  /**
   * Enrich property data with Chimnie API information
   */
  async enrichPropertyWithChimnieData(propertyData: PropertyFormData): Promise<ChimnieProperty | null> {
    try {
      return await chimnieService.enrichPropertyData(propertyData);
    } catch (error) {
      console.error('Failed to enrich property with Chimnie data:', error);
      return null;
    }
  }

  /**
   * Get enhanced property analytics with Chimnie data
   */
  async getEnhancedPropertyAnalytics(propertyId: string): Promise<PropertyAnalytics> {
    const property = await this.getProperty(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    try {
      // Get PropertyData analytics
      const propertyDataAnalytics = await propertyDataService.getPropertyAnalytics(
        property.postcode,
        {
          property_type: property.property_type,
          bedrooms: property.bedrooms,
          construction_date: property.constructionDate,
          finish_quality: property.finishQuality,
          outdoor_space: property.outdoorSpace
        }
      );

      // Get Chimnie data for additional insights
      const chimnieData = await chimnieService.getAreaData(property.postcode);
      const rentalMarket = await chimnieService.getRentalMarket(property.postcode);
      const salesHistory = await chimnieService.getSalesHistory(property.postcode);

      return {
        postcode: property.postcode,
        last_updated: new Date(),
        valuation: propertyDataAnalytics.valuation,
        rental_market: propertyDataAnalytics.rental_market,
        sold_prices: propertyDataAnalytics.sold_prices,
        growth: propertyDataAnalytics.growth,
        demographics: propertyDataAnalytics.demographics,
        chimnieData,
        rentalMarketData: rentalMarket,
        salesHistory,
        errors: [
          ...(propertyDataAnalytics.errors || []),
          ...(chimnieData ? [] : [{
            type: 'chimnie_error',
            error: 'Failed to fetch Chimnie data'
          }])
        ]
      };
    } catch (error) {
      console.error('Failed to get enhanced property analytics:', error);
      return {
        postcode: property.postcode,
        last_updated: new Date(),
        valuation: null,
        rental_market: null,
        sold_prices: null,
        growth: null,
        demographics: null,
        chimnieData: null,
        rentalMarketData: null,
        salesHistory: null,
        errors: [{
          type: 'analytics_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }
  async getPropertyHistory(propertyId: string): Promise<PropertyValueHistory[]> {
    const history = await firebaseService.getDocuments<PropertyValueHistory>(
      this.HISTORY_COLLECTION,
      [['propertyId', '==', propertyId]],
      [['valuationDate', 'desc']]
    );

    return history.map((doc: any) => ({
      ...doc,
      valuationDate: doc.valuationDate?.toDate() || new Date(),
      createdAt: doc.createdAt?.toDate() || new Date()
    }));
  }

  /**
   * Validate property data
   */
  private validatePropertyData(data: PropertyFormData): PropertyValidationResult {
    const errors: { field: string; message: string }[] = [];

    // Required fields
    if (!data.address?.trim()) {
      errors.push({ field: 'address', message: 'Address is required' });
    }

    if (!data.postcode?.trim()) {
      errors.push({ field: 'postcode', message: 'Postcode is required' });
    } else if (!this.isValidUKPostcode(data.postcode)) {
      errors.push({ field: 'postcode', message: 'Invalid UK postcode format' });
    }

    if (!data.property_type?.trim()) {
      errors.push({ field: 'property_type', message: 'Property type is required' });
    }

    if (!data.bedrooms || data.bedrooms < 1 || data.bedrooms > 20) {
      errors.push({ field: 'bedrooms', message: 'Bedrooms must be between 1 and 20' });
    }

    if (data.purchasePrice && (data.purchasePrice < 1000 || data.purchasePrice > 10000000)) {
      errors.push({ field: 'purchasePrice', message: 'Purchase price must be between £1,000 and £10,000,000' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if we have enough data for PropertyData valuation
   */
  private hasEnoughDataForValuation(data: PropertyFormData): boolean {
    return !!(
      data.postcode?.trim() &&
      data.property_type?.trim() &&
      data.bedrooms &&
      data.bedrooms > 0
    );
  }

  /**
   * Check if valuation should be refreshed
   */
  private shouldRefreshValuation(updates: Partial<PropertyFormData>): boolean {
    return !!(
      updates.postcode ||
      updates.property_type ||
      updates.bedrooms ||
      updates.constructionDate ||
      updates.finishQuality ||
      updates.outdoorSpace
    );
  }

  /**
   * Get and store property valuation
   */
  private async getAndStorePropertyValuation(propertyId: string, propertyData: PropertyFormData): Promise<void> {
    try {
      const valuation = await propertyDataService.getPropertyValuation(
        propertyData.postcode!,
        {
          property_type: propertyData.property_type!,
          bedrooms: propertyData.bedrooms!,
          construction_date: propertyData.constructionDate,
          finish_quality: propertyData.finishQuality,
          outdoor_space: propertyData.outdoorSpace
        }
      );

      // Store valuation history
      const historyEntry: Omit<PropertyValueHistory, 'id' | 'createdAt'> = {
        propertyId,
        valuationDate: new Date(),
        rentalValue: valuation.rental_value,
        saleValue: 0, // PropertyData doesn't provide sale valuations
        confidenceIntervalLower: valuation.confidence_interval.lower,
        confidenceIntervalUpper: valuation.confidence_interval.upper,
        dataSource: 'propertydata'
      };

      await firebaseService.addDocument(this.HISTORY_COLLECTION, historyEntry);

      // Update property with current valuation
      await firebaseService.updateDocument(this.COLLECTION_NAME, propertyId, {
        currentValue: valuation.rental_value * 12, // Annual rental value
        lastValuation: valuation,
        lastValuationDate: new Date()
      });

    } catch (error) {
      console.error('Failed to get property valuation:', error);
      throw error;
    }
  }

  /**
   * Upload property images to Firebase Storage
   */
  private async uploadPropertyImages(images: File[]): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const fileName = `properties/${Date.now()}_${index}_${image.name}`;
      return firebaseService.uploadFile(fileName, image);
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Failed to upload images:', error);
      throw new Error('Image upload failed');
    }
  }

  /**
   * Delete property images from Firebase Storage
   */
  private async deletePropertyImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(url => {
      // Extract file path from URL
      const filePath = url.split('/').pop();
      return firebaseService.deleteFile(`properties/${filePath}`);
    });

    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete images:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Delete cached property data
   */
  private async deletePropertyCache(propertyId: string): Promise<void> {
    try {
      const cacheDocs = await firebaseService.getDocuments<PropertyDataCache>(
        this.CACHE_COLLECTION,
        [['propertyId', '==', propertyId]]
      );

      const deletePromises = cacheDocs.map((doc: any) => 
        firebaseService.deleteDocument(this.CACHE_COLLECTION, doc.id)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete property cache:', error);
    }
  }

  /**
   * Validate UK postcode format
   */
  private isValidUKPostcode(postcode: string): boolean {
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.replace(/\s/g, ''));
  }

  /**
   * Get property statistics for landlord dashboard
   */
  async getLandlordStats(userId: string): Promise<{
    totalProperties: number;
    totalValue: number;
    averageRent: number;
    propertiesByType: Record<string, number>;
  }> {
    const properties = await this.getLandlordProperties(userId);
    
    const totalValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
    const totalRent = properties.reduce((sum, prop) => sum + (prop.monthlyRent || 0), 0);
    const averageRent = properties.length > 0 ? totalRent / properties.length : 0;

    const propertiesByType = properties.reduce((acc, prop) => {
      acc[prop.property_type] = (acc[prop.property_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProperties: properties.length,
      totalValue,
      averageRent,
      propertiesByType
    };
  }
}

// Singleton instance
export const propertyService = new PropertyService();
