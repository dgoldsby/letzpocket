import { 
  Property, 
  PropertyAnalytics, 
  ValuationData, 
  RentalMarketData, 
  SoldPricesData,
  DemographicsData,
  GrowthData,
  PropertyValueHistory,
  PropertyDataCache 
} from '../types/property';
import { firebaseService } from './firebaseService';
import { propertyDataService } from './propertyData';
import { chimnieService, ChimnieProperty } from './chimnieService';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase';

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
  images?: (string | File)[];
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
      imageUrls = await this.uploadPropertyImages(propertyData.images.filter(img => img instanceof File) as File[]);
    }

    // Create property document
    const property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
      address: propertyData.address,
      postcode: propertyData.postcode.toUpperCase().replace(/\s/g, ''),
      city: propertyData.city,
      property_type: propertyData.property_type,
      bedrooms: propertyData.bedrooms,
      landlordId: userId,
      images: imageUrls,
      status: 'active',
      rental: {
        currentRent: 0,
        marketRent: 0,
        lastReview: new Date(),
        nextReview: new Date()
      },
      valuation: {
        estimatedValue: 0,
        lastUpdated: new Date(),
        confidence: 'low'
      },
      analytics: {
        postcode: propertyData.postcode,
        last_updated: new Date(),
        valuation: null,
        rental: null,
        marketTrends: null,
        comparableProperties: null,
        epcData: null,
        chimnieData: null,
        errors: []
      }
    };

    // Only add optional fields if they exist
    if (propertyData.purchasePrice !== undefined) {
      property.purchasePrice = propertyData.purchasePrice;
    }
    if (propertyData.constructionDate) {
      property.constructionDate = propertyData.constructionDate;
    }
    if (propertyData.finishQuality) {
      property.finishQuality = propertyData.finishQuality;
    }
    if (propertyData.outdoorSpace) {
      property.outdoorSpace = propertyData.outdoorSpace;
    }

    const docRef = await firebaseService.addDocument(this.COLLECTION_NAME, property as Omit<Property, 'id'>);
    
    // Get initial valuation if we have enough data AND API key is configured
    if (this.hasEnoughDataForValuation(propertyData) && process.env.REACT_APP_PROPERTYDATA_API_KEY) {
      try {
        await this.getAndStorePropertyValuation(docRef.id, propertyData);
      } catch (error) {
        console.warn('Initial valuation failed:', error);
        // Don't fail property creation if valuation fails
      }
    } else {
      console.log('Skipping initial valuation - API key not configured or insufficient data');
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
      [['landlordId', '==', userId]]
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
      createdAt: property.createdAt || new Date(),
      updatedAt: property.updatedAt || new Date()
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
      imageUrls = await this.uploadPropertyImages(updates.images.filter(img => img instanceof File) as File[]);
    }

    const updateData: Partial<Property> = {
      ...updates,
      postcode: updates.postcode?.toUpperCase().replace(/\s/g, ''),
      images: imageUrls.length > 0 ? imageUrls : undefined,
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

    if (property.landlordId !== userId) {
      throw new Error('Not authorized to delete this property');
    }

    // Delete associated images from storage
    if (property.images && property.images.length > 0) {
      await this.deletePropertyImages(property.images);
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
        ...analytics
      };
    } catch (error) {
      console.error('Failed to get property analytics:', error);
      return {
        postcode: property.postcode,
        last_updated: new Date(),
        valuation: null,
        rental: null,
        marketTrends: null,
        comparableProperties: null,
        epcData: null,
        chimnieData: null,
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
        rental: propertyDataAnalytics.rental,
        marketTrends: null,
        comparableProperties: null,
        epcData: null,
        chimnieData,
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
        rental: null,
        marketTrends: null,
        comparableProperties: null,
        epcData: null,
        chimnieData: null,
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
      ['valuationDate', 'desc']
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
        date: new Date(),
        value: valuation.rental,
        source: 'propertydata'
      };

      await firebaseService.addDocument(this.HISTORY_COLLECTION, historyEntry);

      // Update property with current valuation
      await firebaseService.updateDocument(this.COLLECTION_NAME, propertyId, {
        currentValue: valuation.rental * 12, // Annual rental value
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
    
    const totalValue = properties.reduce((sum, prop) => sum + (prop.rental.currentRent || 0), 0);
    const totalRent = properties.reduce((sum, prop) => sum + (prop.rental.marketRent || 0), 0);
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

  /**
   * Fetch PropertyData API information for a property
   */
  async fetchPropertyData(propertyId: string): Promise<any> {
    try {
      const property = await this.getProperty(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const valuationData = await propertyDataService.getPropertyValuation(property.postcode);
      
      // Update property with new data
      await this.updatePropertyAnalytics(propertyId, {
        valuation: valuationData,
        last_updated: new Date()
      });

      return valuationData;
    } catch (error) {
      console.error('Failed to fetch PropertyData:', error);
      throw error;
    }
  }

  /**
   * Fetch EPC data for a property
   */
  async fetchEPCData(propertyId: string): Promise<any> {
    try {
      const property = await this.getProperty(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // TODO: Implement EPC API integration
      console.log('EPC data fetching not yet implemented');
      return { message: 'EPC data not yet available' };
    } catch (error) {
      console.error('Failed to fetch EPC data:', error);
      throw error;
    }
  }

  /**
   * Fetch Chimnie data for a property using residential address endpoint
   */
  async fetchChimnieData(propertyId: string): Promise<any> {
    console.log(`🏠 fetchChimnieData called for property: ${propertyId}`);
    
    try {
      const property = await this.getProperty(propertyId);
      console.log('📋 Retrieved property:', property);
      
      if (!property) {
        throw new Error('Property not found');
      }

      // Create full address from property data
      const fullAddress = `${property.address}, ${property.city}, ${property.postcode}`;
      console.log('📍 Full address for Chimnie API:', fullAddress);
      
      // Get comprehensive residential address data with specific fields
      const chimnieData = await chimnieService.getResidentialAddressData(fullAddress);
      console.log('📊 Chimnie API response:', chimnieData);
      
      if (chimnieData) {
        console.log('✅ Chimnie data received, updating property...');
        
        // Update property with Chimnie data including values and bills
        await this.updatePropertyAnalytics(propertyId, {
          chimnieData: {
            address: chimnieData.address,
            value: chimnieData.value,
            bills: chimnieData.bills,
            last_updated: chimnieData.last_updated,
            dateAdded: new Date().toISOString()
          },
          last_updated: new Date()
        });

        // Also update property's financial information
        await this.updatePropertyFinancials(propertyId, {
          estimatedValue: chimnieData.value.sale,
          estimatedRent: chimnieData.value.rental,
          estimatedBills: chimnieData.bills
        });
        
        console.log('✅ Property updated with Chimnie data');
      } else {
        console.log('❌ No Chimnie data received');
      }

      return chimnieData;
    } catch (error) {
      console.error('❌ Failed to fetch Chimnie data:', error);
      throw error;
    }
  }

  /**
   * Update property financial information
   */
  private async updatePropertyFinancials(propertyId: string, financials: {
    estimatedValue?: number;
    estimatedRent?: number;
    estimatedBills?: {
      tax: number;
      energy: number;
      telecomms: number;
    };
  }): Promise<void> {
    try {
      const propertyRef = doc(firestore, this.COLLECTION_NAME, propertyId);
      
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      if (financials.estimatedValue !== undefined) {
        updates['valuation.estimatedValue'] = financials.estimatedValue;
        updates['valuation.lastUpdated'] = new Date();
      }

      if (financials.estimatedRent !== undefined) {
        updates['rental.marketRent'] = financials.estimatedRent;
        updates['rental.lastReview'] = new Date();
      }

      if (financials.estimatedBills) {
        updates['estimatedBills'] = financials.estimatedBills;
      }

      await updateDoc(propertyRef, updates);
    } catch (error) {
      console.error('Failed to update property financials:', error);
      throw error;
    }
  }

  /**
   * Update property analytics with new data
   */
  private async updatePropertyAnalytics(propertyId: string, newAnalytics: Partial<PropertyAnalytics>): Promise<void> {
    try {
      const propertyRef = doc(firestore, this.COLLECTION_NAME, propertyId);
      const propertyDoc = await getDoc(propertyRef);
      
      if (propertyDoc.exists()) {
        const currentAnalytics = propertyDoc.data()?.analytics || {
          postcode: '',
          last_updated: new Date(),
          valuation: null,
          rental: null,
          marketTrends: null,
          comparableProperties: null,
          epcData: null,
          chimnieData: null,
          errors: []
        };

        const updatedAnalytics = {
          ...currentAnalytics,
          ...newAnalytics
        };

        await updateDoc(propertyRef, {
          analytics: updatedAnalytics,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Failed to update property analytics:', error);
      throw error;
    }
  }
}

// Singleton instance
export const propertyService = new PropertyService();
