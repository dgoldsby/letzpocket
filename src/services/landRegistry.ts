// HM Land Registry Price Paid Data Service
export interface LandRegistryTransaction {
  transactionId: string;
  price: number;
  dateOfTransfer: string;
  postcode: string;
  propertyType: 'D' | 'S' | 'T' | 'F' | 'O'; // Detached, Semi-detached, Terraced, Flat, Other
  oldNew: 'Y' | 'N'; // New build or existing property
  duration: 'F' | 'L'; // Freehold or Leasehold
  paon: string; // Primary Addressable Object Name (house number/name)
  saon: string; // Secondary Addressable Object Name (flat number)
  street: string;
  locality: string;
  town: string;
  district: string;
  county: string;
  categoryType: string;
  recordStatus: string;
}

export interface PropertyAnalytics {
  avgPrice: number;
  medianPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  transactionCount: number;
  pricePerSqm?: number;
  yield?: number;
  monthlyTrend: Array<{
    month: string;
    avgPrice: number;
    transactionCount: number;
  }>;
}

export interface PostcodeAnalytics {
  postcode: string;
  district: string;
  town: string;
  county: string;
  analytics: PropertyAnalytics;
  propertyTypes: {
    [key: string]: {
      count: number;
      avgPrice: number;
    };
  };
}

class LandRegistryService {
  private readonly BASE_URL = 'https://landregistry.data.gov.uk';
  private readonly PPD_ENDPOINT = '/data/ppd.csv';

  /**
   * Fetch Price Paid Data for a specific postcode area
   */
  async fetchPricePaidData(postcode?: string, limit: number = 1000): Promise<LandRegistryTransaction[]> {
    throw new Error('HM Land Registry API requires server-side implementation due to CORS restrictions. This feature will be available when backend services are deployed.');
  }

  /**
   * Build SPARQL query for postcode filtering
   */
  private buildPostcodeQuery(postcode: string, limit: number): string {
    const postcodePrefix = postcode.split(' ')[0]; // Use postcode area (e.g., 'SW1A')
    
    return `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      
      SELECT ?price ?date ?postcode ?propertyType ?newBuild ?duration ?paon ?saon ?street ?locality ?town ?district ?county
      WHERE {
        ?transaction lrppi:pricePaid ?price ;
                   lrppi:transactionDate ?date ;
                   lrppi:propertyAddress ?address .
        ?address lrcommon:postcode ?postcode .
        
        FILTER(regex(str(?postcode), "^${postcodePrefix}", "i"))
        
        OPTIONAL { ?transaction lrppi:propertyType ?propertyType }
        OPTIONAL { ?transaction lrppi:newBuild ?newBuild }
        OPTIONAL { ?transaction lrppi:transactionCategory ?category }
        OPTIONAL { ?transaction lrppi:estate ?duration }
        OPTIONAL { ?address lrcommon:paon ?paon }
        OPTIONAL { ?address lrcommon:saon ?saon }
        OPTIONAL { ?address lrcommon:street ?street }
        OPTIONAL { ?address lrcommon:locality ?locality }
        OPTIONAL { ?address lrcommon:town ?town }
        OPTIONAL { ?address lrcommon:district ?district }
        OPTIONAL { ?address lrcommon:county ?county }
      }
      LIMIT ${limit}
    `;
  }

  /**
   * Parse SPARQL results into transaction objects
   */
  private parseSparqlResults(data: any): LandRegistryTransaction[] {
    const bindings = data.results?.bindings || [];
    
    return bindings.map((binding: any, index: number) => ({
      transactionId: `lr-${index}`,
      price: parseFloat(binding.price?.value || '0'),
      dateOfTransfer: binding.date?.value || '',
      postcode: binding.postcode?.value || '',
      propertyType: binding.propertyType?.value || 'O',
      oldNew: binding.newBuild?.value === 'true' ? 'Y' : 'N',
      duration: binding.duration?.value || 'F',
      paon: binding.paon?.value || '',
      saon: binding.saon?.value || '',
      street: binding.street?.value || '',
      locality: binding.locality?.value || '',
      town: binding.town?.value || '',
      district: binding.district?.value || '',
      county: binding.county?.value || '',
      categoryType: '',
      recordStatus: 'A'
    }));
  }

  /**
   * Parse CSV data from bulk download
   */
  private parseCSVData(csvData: string, limit: number): LandRegistryTransaction[] {
    const lines = csvData.split('\n');
    const transactions: LandRegistryTransaction[] = [];
    
    // Skip header and process data rows
    for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = this.parseCSVLine(line);
      if (fields.length >= 16) {
        transactions.push({
          transactionId: `lr-${i}`,
          price: parseFloat(fields[1] || '0'),
          dateOfTransfer: fields[2] || '',
          postcode: fields[3] || '',
          propertyType: fields[4] as any || 'O',
          oldNew: fields[5] as any || 'N',
          duration: fields[6] as any || 'F',
          paon: fields[7] || '',
          saon: fields[8] || '',
          street: fields[9] || '',
          locality: fields[10] || '',
          town: fields[11] || '',
          district: fields[12] || '',
          county: fields[13] || '',
          categoryType: fields[14] || '',
          recordStatus: fields[15] || 'A'
        });
      }
    }
    
    return transactions;
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Analyze property data for a postcode area
   */
  async analyzePostcodeArea(postcode: string): Promise<PostcodeAnalytics> {
    const transactions = await this.fetchPricePaidData(postcode, 2000);
    
    if (transactions.length === 0) {
      throw new Error(`No transactions found for postcode ${postcode}`);
    }

    const prices = transactions.map(t => t.price).sort((a, b) => a - b);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];
    
    // Group by property type
    const propertyTypes: { [key: string]: { count: number; avgPrice: number } } = {};
    transactions.forEach(transaction => {
      const type = this.getPropertyTypeLabel(transaction.propertyType);
      if (!propertyTypes[type]) {
        propertyTypes[type] = { count: 0, avgPrice: 0 };
      }
      propertyTypes[type].count++;
      propertyTypes[type].avgPrice += transaction.price;
    });

    // Calculate averages for each property type
    Object.keys(propertyTypes).forEach(type => {
      propertyTypes[type].avgPrice = Math.round(propertyTypes[type].avgPrice / propertyTypes[type].count);
    });

    // Calculate monthly trends (last 12 months)
    const monthlyTrend = this.calculateMonthlyTrend(transactions);

    return {
      postcode,
      district: transactions[0]?.district || '',
      town: transactions[0]?.town || '',
      county: transactions[0]?.county || '',
      analytics: {
        avgPrice: Math.round(avgPrice),
        medianPrice: Math.round(medianPrice),
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        transactionCount: transactions.length,
        monthlyTrend
      },
      propertyTypes
    };
  }

  /**
   * Calculate monthly price trends
   */
  private calculateMonthlyTrend(transactions: LandRegistryTransaction[]) {
    const monthlyData: { [key: string]: { prices: number[]; count: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.dateOfTransfer);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { prices: [], count: 0 };
      }
      
      monthlyData[monthKey].prices.push(transaction.price);
      monthlyData[monthKey].count++;
    });

    // Get last 12 months and sort
    const months = Object.keys(monthlyData)
      .sort()
      .slice(-12);

    return months.map(month => ({
      month,
      avgPrice: Math.round(
        monthlyData[month].prices.reduce((sum, price) => sum + price, 0) / monthlyData[month].prices.length
      ),
      transactionCount: monthlyData[month].count
    }));
  }

  /**
   * Convert property type code to readable label
   */
  private getPropertyTypeLabel(code: string): string {
    const labels: { [key: string]: string } = {
      'D': 'Detached',
      'S': 'Semi-detached',
      'T': 'Terraced',
      'F': 'Flat',
      'O': 'Other'
    };
    return labels[code] || 'Other';
  }

  /**
   * Calculate estimated rental yield (simplified)
   */
  calculateRentalYield(propertyPrice: number, estimatedMonthlyRent: number): number {
    const annualRent = estimatedMonthlyRent * 12;
    return (annualRent / propertyPrice) * 100;
  }

  /**
   * Get property valuation estimate based on comparable sales
   */
  async getValuationEstimate(postcode: string, propertyType: string, bedrooms?: number): Promise<{
    estimatedValue: number;
    confidence: number;
    comparableSales: number;
    lastUpdated: string;
  }> {
    const analytics = await this.analyzePostcodeArea(postcode);
    const typeData = analytics.propertyTypes[propertyType];
    
    if (!typeData || typeData.count === 0) {
      throw new Error(`No comparable sales found for ${propertyType} in ${postcode}`);
    }

    // Simple valuation based on average price of similar properties
    let estimatedValue = typeData.avgPrice;
    let confidence = Math.min(typeData.count / 10, 1); // More data = higher confidence

    // Adjust for bedrooms if available (simplified)
    if (bedrooms) {
      // This would need more sophisticated logic with real data
      const bedroomAdjustment = 1 + (bedrooms - 2) * 0.1; // 10% per bedroom above 2
      estimatedValue *= bedroomAdjustment;
    }

    return {
      estimatedValue: Math.round(estimatedValue),
      confidence: Math.round(confidence * 100),
      comparableSales: typeData.count,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const landRegistryService = new LandRegistryService();
