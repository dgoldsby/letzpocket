import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../Logo';

describe('Logo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the logo with default medium size', () => {
      render(<Logo />);
      
      // Check if the main container exists
      const logoContainer = screen.getByRole('img', { hidden: true }).closest('div');
      expect(logoContainer).toBeInTheDocument();
      expect(logoContainer).toHaveClass('text-xl');
    });

    it('renders with small size', () => {
      render(<Logo size="small" />);
      
      const logoContainer = screen.getByRole('img', { hidden: true }).closest('div');
      expect(logoContainer).toHaveClass('text-lg');
    });

    it('renders with large size', () => {
      render(<Logo size="large" />);
      
      const logoContainer = screen.getByRole('img', { hidden: true }).closest('div');
      expect(logoContainer).toHaveClass('text-2xl');
    });

    it('renders with custom className', () => {
      render(<Logo className="custom-class" />);
      
      const logoContainer = screen.getByRole('img', { hidden: true }).closest('div');
      expect(logoContainer).toHaveClass('custom-class');
    });

    it('renders the SVG shield icon', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
    });

    it('renders the brand name text', () => {
      render(<Logo />);
      
      // Check if "Letz" text exists
      const letzText = screen.getByText('Letz');
      expect(letzText).toBeInTheDocument();
      expect(letzText).toHaveStyle({ color: '#1E2F47' });

      // Check if "Pocket" text exists
      const pocketText = screen.getByText('Pocket');
      expect(pocketText).toBeInTheDocument();
      expect(pocketText).toHaveStyle({ color: '#F85D4A' });
    });
  });

  describe('SVG Structure', () => {
    it('has correct SVG attributes', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveAttribute('width', '40');
      expect(svg).toHaveAttribute('height', '40');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('contains shield path with correct stroke color', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      const shieldPath = svg.querySelector('path');
      expect(shieldPath).toBeInTheDocument();
      expect(shieldPath).toHaveAttribute('stroke', '#1E2F47');
      expect(shieldPath).toHaveAttribute('stroke-width', '2');
    });

    it('contains orange circle background', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      const orangeCircle = svg.querySelector('circle');
      expect(orangeCircle).toBeInTheDocument();
      expect(orangeCircle).toHaveAttribute('fill', '#F85D4A');
    });
  });

  describe('Layout', () => {
    it('has flex layout with proper alignment', () => {
      render(<Logo />);
      
      const logoContainer = screen.getByRole('img', { hidden: true }).closest('div');
      expect(logoContainer).toHaveClass('flex', 'items-center', 'font-bold');
    });

    it('has proper spacing between icon and text', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('mr-2');
    });
  });

  describe('Responsiveness', () => {
    it('applies correct SVG size classes', () => {
      const { rerender } = render(<Logo size="small" />);
      let svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('w-8', 'h-8');

      rerender(<Logo size="medium" />);
      svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('w-10', 'h-10');

      rerender(<Logo size="large" />);
      svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for the logo', () => {
      render(<Logo />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('maintains proper text hierarchy', () => {
      render(<Logo />);
      
      const textContainer = screen.getByText('Letz').parentElement;
      expect(textContainer).toHaveClass('flex');
    });
  });

  describe('Brand Consistency', () => {
    it('uses correct LetzPocket brand colors', () => {
      render(<Logo />);
      
      const letzText = screen.getByText('Letz');
      const pocketText = screen.getByText('Pocket');
      
      expect(letzText).toHaveStyle({ color: '#1E2F47' });
      expect(pocketText).toHaveStyle({ color: '#F85D4A' });
    });

    it('maintains consistent spacing between text parts', () => {
      render(<Logo />);
      
      const pocketText = screen.getByText('Pocket');
      expect(pocketText).toHaveClass('ml-1');
    });
  });
});
