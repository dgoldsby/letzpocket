import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { getAuth } from 'firebase/auth';

export interface SignInControl {
  enabled: boolean;
  message?: string;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  visible: boolean;
  order: number;
}

export interface SectionVisibility {
  navigation: boolean;
  hero: boolean;
  features: boolean;
  chatbot: boolean;
  testimonials: boolean;
  pricing: boolean;
  freeReview: boolean;
  newsletter: boolean;
  footer: boolean;
}

export type TextColor = 'black' | 'orange' | 'blue';

export interface HeroText {
  header: string;
  subheader: string;
  headerColor: TextColor;
  subheaderColor: TextColor;
}

export interface ContentSettings {
  sections: ContentSection[];
  signInControl: SignInControl;
  sectionVisibility: SectionVisibility;
  heroText: HeroText;
  lastModified: any;
  modifiedBy: string;
}

class ContentService {
  private readonly CONTENT_DOC_ID = 'site-content';
  private readonly CONTENT_COLLECTION = 'content';

  async saveContentSettings(
    sections: ContentSection[], 
    signInControl: SignInControl,
    sectionVisibility: SectionVisibility,
    heroText: HeroText,
    modifiedBy: string
  ): Promise<void> {
    try {
      const contentDoc: ContentSettings = {
        sections,
        signInControl,
        sectionVisibility,
        heroText,
        lastModified: serverTimestamp(),
        modifiedBy
      };

      const docRef = doc(firestore, this.CONTENT_COLLECTION, this.CONTENT_DOC_ID);
      await setDoc(docRef, contentDoc, { merge: true });
      
      console.log('✅ Content settings saved to Firestore successfully');
      console.log('📄 Document ID:', this.CONTENT_DOC_ID);
      console.log('👤 Modified by:', modifiedBy);
    } catch (error) {
      console.error('❌ Error saving content settings:', error);
      
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      // Check if it's a Firebase permissions error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission')) {
        throw new Error('Firebase permissions error. Please check your authentication status and Firestore security rules.');
      } else if (errorMessage.includes('403')) {
        throw new Error('Firebase access denied. The content collection may not exist or you lack write permissions.');
      } else if (errorMessage.includes('unavailable')) {
        throw new Error('Firebase is unavailable. Please check your internet connection and try again.');
      } else {
        throw new Error(`Failed to save content settings: ${errorMessage}`);
      }
    }
  }

  async loadContentSettings(): Promise<ContentSettings | null> {
    try {
      console.log('🔍 Loading content settings from Firebase...');
      const docRef = doc(firestore, this.CONTENT_COLLECTION, this.CONTENT_DOC_ID);
      const docSnap = await getDoc(docRef);

      console.log('📄 Document exists:', docSnap.exists());
      console.log('📄 Document data:', docSnap.data());

      if (docSnap.exists()) {
        const data = docSnap.data() as ContentSettings;
        console.log('✅ Content settings loaded from Firestore:', data);
        return data;
      } else {
        console.log('❌ No content settings found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading content settings:', error);
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission-denied')) {
        console.error('🔐 Authentication error - user may not be logged in');
        console.error('🔐 Current auth state:', getAuth().currentUser);
      }
      
      throw new Error('Failed to load content settings');
    }
  }

  async loadSignInControl(): Promise<SignInControl> {
    try {
      const settings = await this.loadContentSettings();
      return settings?.signInControl || { enabled: true, message: '' };
    } catch (error) {
      console.error('Error loading sign-in control:', error);
      return { enabled: true, message: '' };
    }
  }

  async loadSectionVisibility(): Promise<SectionVisibility> {
    try {
      const settings = await this.loadContentSettings();
      return settings?.sectionVisibility || {
        navigation: true,
        hero: true,
        features: true,
        chatbot: true,
        testimonials: false,
        pricing: false,
        freeReview: true,
        newsletter: true,
        footer: true
      };
    } catch (error) {
      console.error('Error loading section visibility:', error);
      return {
        navigation: true,
        hero: true,
        features: true,
        chatbot: true,
        testimonials: false,
        pricing: false,
        freeReview: true,
        newsletter: true,
        footer: true
      };
    }
  }

  async loadSections(): Promise<ContentSection[]> {
    try {
      const settings = await this.loadContentSettings();
      return settings?.sections || [];
    } catch (error) {
      console.error('Error loading sections:', error);
      return [];
    }
  }

  async loadHeroText(): Promise<HeroText> {
    try {
      const settings = await this.loadContentSettings();
      return settings?.heroText || {
        header: 'The Smart Way to Manage Your UK Rental Portfolio',
        subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
        headerColor: 'black',
        subheaderColor: 'black'
      };
    } catch (error) {
      console.error('Error loading hero text:', error);
      return {
        header: 'The Smart Way to Manage Your UK Rental Portfolio',
        subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
        headerColor: 'black',
        subheaderColor: 'black'
      };
    }
  }

  // Fallback to localStorage for offline scenarios
  saveToLocalStorage(
    sections: ContentSection[], 
    signInControl: SignInControl, 
    sectionVisibility: SectionVisibility,
    heroText: HeroText
  ): void {
    localStorage.setItem('landingPageSections', JSON.stringify(sections));
    localStorage.setItem('signInControl', JSON.stringify(signInControl));
    localStorage.setItem('homepageSectionVisibility', JSON.stringify(sectionVisibility));
    localStorage.setItem('heroText', JSON.stringify(heroText));
  }

  loadFromLocalStorage(): { 
    sections: ContentSection[]; 
    signInControl: SignInControl; 
    sectionVisibility: SectionVisibility;
    heroText: HeroText;
  } | null {
    try {
      const savedSections = localStorage.getItem('landingPageSections');
      const savedSignInControl = localStorage.getItem('signInControl');
      const savedSectionVisibility = localStorage.getItem('homepageSectionVisibility');
      const savedHeroText = localStorage.getItem('heroText');
      
      if (savedSections && savedSignInControl && savedSectionVisibility) {
        return {
          sections: JSON.parse(savedSections),
          signInControl: JSON.parse(savedSignInControl),
          sectionVisibility: JSON.parse(savedSectionVisibility),
          heroText: savedHeroText ? JSON.parse(savedHeroText) : {
            header: 'The Smart Way to Manage Your UK Rental Portfolio',
            subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
            headerColor: 'black',
            subheaderColor: 'black'
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  // Legacy support for old localStorage format
  loadLegacySectionVisibility(): SectionVisibility | null {
    try {
      const saved = localStorage.getItem('homepageSectionVisibility');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Error loading legacy section visibility:', error);
      return null;
    }
  }
}

export const contentService = new ContentService();
