import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  const containerSizes = {
    small: 'text-lg',
    medium: 'text-xl', 
    large: 'text-2xl'
  };

  const svgSizes = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${containerSizes[size]} ${className} flex items-center font-bold`}>
      {/* Shield and Lock SVG */}
      <svg 
        className={`${svgSizes[size]} mr-2`}
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Outline */}
        <path d="M20 2 L35 7 L35 20 C35 28 28 35 20 38 C12 35 5 28 5 20 L5 7 L20 2 Z" 
              stroke="#1E2F47" 
              stroke-width="2" 
              fill="none"/>
        
        {/* Orange Circle Background */}
        <circle cx="20" cy="18" r="8" fill="#F85D4A"/>
        
        {/* Keyhole Shape */}
        <circle cx="20" cy="15" r="3" fill="white"/>
        <rect x="18" y="15" width="4" height="8" fill="white"/>
        <rect x="17" y="21" width="6" height="2" fill="white"/>
      </svg>

      {/* Brand Name using HTML */}
      <div className="flex">
        <span style={{ color: '#1E2F47' }}>Letz</span>
        <span style={{ color: '#F85D4A' }} className="ml-1">Pocket</span>
      </div>
    </div>
  );
};

export default Logo;
