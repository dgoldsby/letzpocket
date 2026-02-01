import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';

// Simple test to verify the newsletter form renders
describe('LandingPage Newsletter', () => {
  it('renders newsletter signup form', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Stay Updated with UK Rental Market Insights')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });
});
