import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from '../LandingPage';
import { mailchimpService } from '../../services/mailchimp';

// Mock the mailchimp service
jest.mock('../../services/mailchimp');

// Mock the Logo component
jest.mock('../Logo', () => {
  return function MockLogo({ size }: { size?: string }) {
    return <div data-testid="logo" data-size={size}>LetzPocket Logo</div>;
  };
});

describe('LandingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Newsletter Signup', () => {
    it('renders newsletter signup section', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Stay Updated with UK Rental Market Insights')).toBeInTheDocument();
      expect(screen.getByText('Get the latest updates on rental regulations, market trends, and landlord tips.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });

    it('allows user to type email in newsletter form', async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('submits newsletter signup successfully', async () => {
      (mailchimpService.addSubscriber as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      });

      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(mailchimpService.addSubscriber).toHaveBeenCalledWith('test@example.com');
      });

      await waitFor(() => {
        expect(screen.getByText('Thanks for subscribing! Check your email for confirmation.')).toBeInTheDocument();
      });
    });

    it('shows loading state during newsletter submission', async () => {
      (mailchimpService.addSubscriber as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(subscribeButton);

      expect(screen.getByText('Subscribing...')).toBeInTheDocument();
      expect(subscribeButton).toBeDisabled();
    });

    it('handles newsletter signup errors gracefully', async () => {
      (mailchimpService.addSubscriber as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Failed to subscribe'
      });

      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(mailchimpService.addSubscriber).toHaveBeenCalledWith('test@example.com');
      });

      // Should not show success message on error
      expect(screen.queryByText('Thanks for subscribing! Check your email for confirmation.')).not.toBeInTheDocument();
      
      // Form should still be visible for retry
      expect(emailInput).toBeInTheDocument();
      expect(subscribeButton).toBeInTheDocument();
    });

    it('validates email format before submission', async () => {
      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'invalid-email');
      
      // Form should not submit with invalid email
      fireEvent.click(subscribeButton);
      
      // Mailchimp service should not be called
      expect(mailchimpService.addSubscriber).not.toHaveBeenCalled();
    });

    it('resets form after successful submission', async () => {
      (mailchimpService.addSubscriber as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      });

      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(screen.getByText('Thanks for subscribing! Check your email for confirmation.')).toBeInTheDocument();
      });

      // After showing success, the form should be hidden
      expect(screen.queryByPlaceholderText('Enter your email')).not.toBeInTheDocument();
    });

    it('calls mailchimp service with correct parameters', async () => {
      (mailchimpService.addSubscriber as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      });

      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'newsletter@example.com');
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(mailchimpService.addSubscriber).toHaveBeenCalledWith('newsletter@example.com');
      });
    });
  });

  describe('Rendering', () => {
    it('renders main landing page elements', () => {
      render(<LandingPage />);
      
      expect(screen.getByText(/The Smart Way to Manage Your/)).toBeInTheDocument();
      expect(screen.getByText(/UK Rental Portfolio/)).toBeInTheDocument();
      expect(screen.getByText('LetzPocket')).toBeInTheDocument();
    });

    it('renders Call to Action buttons', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Free Agreement Review')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<LandingPage />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });
      expect(subscribeButton).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      render(<LandingPage />);
      
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });
  });
});
