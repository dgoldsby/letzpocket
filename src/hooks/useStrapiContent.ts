import { useState, useEffect } from 'react';
import { strapiService, StrapiHero, StrapiSection } from '../services/strapi';

export function useStrapiHero() {
  const [heroText, setHeroText] = useState({
    header: 'The Smart Way to Manage Your UK Rental Portfolio',
    subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
    headerColor: 'black' as 'black' | 'orange' | 'blue',
    subheaderColor: 'black' as 'black' | 'orange' | 'blue'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const hero = await strapiService.getHero();
        if (hero) {
          setHeroText({
            header: hero.header,
            subheader: hero.subheader,
            headerColor: hero.headerColor || 'black',
            subheaderColor: hero.subheaderColor || 'black'
          });
        }
      } catch (error) {
        console.error('Failed to load hero from Strapi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHero();
  }, []);

  const getTextColorClass = strapiService.getTextColorClass;

  return {
    heroText,
    loading,
    getTextColorClass
  };
}

export function useStrapiSections() {
  const [sections, setSections] = useState<Record<string, boolean>>({
    navigation: true,
    hero: true,
    features: true,
    chatbot: true,
    testimonials: false,
    pricing: false,
    freeReview: true,
    newsletter: true,
    footer: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const strapiSections = await strapiService.getSections();
        const sectionMap: Record<string, boolean> = {};
        
        strapiSections.forEach(section => {
          // Handle both camelCase and space-separated names
          const sectionName = section.name === 'free review' ? 'freeReview' : section.name;
          sectionMap[sectionName] = section.visible;
        });
        
        setSections(prev => ({ ...prev, ...sectionMap }));
      } catch (error) {
        console.error('Failed to load sections from Strapi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);

  return {
    sections,
    loading
  };
}
