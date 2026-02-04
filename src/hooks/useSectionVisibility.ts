import React, { useState } from 'react';

export function useSectionVisibility() {
  const [sectionFlags, setSectionFlags] = useState({
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

  // Listen for admin panel updates (legacy support)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SECTION_VISIBILITY_UPDATE') {
        setSectionFlags(event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    sectionFlags
  };
}
