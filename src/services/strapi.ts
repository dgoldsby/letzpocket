const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'https://letzpocket-strapi-zta4hvqhiq-nw.a.run.app';

export interface StrapiHero {
  id: number;
  documentId: string;
  header: string;
  subheader: string;
  headerColor: 'black' | 'orange' | 'blue' | null;
  subheaderColor: 'black' | 'orange' | 'blue' | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface StrapiSection {
  id: number;
  documentId: string;
  name: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

class StrapiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = STRAPI_URL;
  }

  async getHero(): Promise<StrapiHero | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/heroes?populate=*`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching hero from Strapi:', error);
      return null;
    }
  }

  async getSections(): Promise<StrapiSection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sections`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching sections from Strapi:', error);
      return [];
    }
  }

  getTextColorClass = (color: 'black' | 'orange' | 'blue') => {
    switch (color) {
      case 'black':
        return 'text-gray-900';
      case 'orange':
        return 'text-lp-orange-600';
      case 'blue':
        return 'text-lp-blue-600';
      default:
        return 'text-gray-900';
    }
  };
}

export const strapiService = new StrapiService();
