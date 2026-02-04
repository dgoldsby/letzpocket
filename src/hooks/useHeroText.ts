import { useState } from 'react';

export function useHeroText() {
  const [heroText] = useState({
    header: 'The Smart Way to Manage Your UK Rental Portfolio',
    subheader: 'LetzPocket empowers UK landlords with AI-powered tools for compliance checking, yield calculations, and portfolio management. Stay ahead of the Renters Rights Act and maximize your rental returns.',
    headerColor: 'black' as 'black' | 'orange' | 'blue',
    subheaderColor: 'black' as 'black' | 'orange' | 'blue'
  });

  const getTextColorClass = (color: 'black' | 'orange' | 'blue') => {
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

  return {
    heroText,
    getTextColorClass
  };
}
