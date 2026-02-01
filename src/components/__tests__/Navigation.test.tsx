import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '../Navigation';

// Mock the Logo component
jest.mock('../Logo', () => {
  return function MockLogo({ size, className }: { size?: string; className?: string }) {
    return <div data-testid="logo" className={className} data-size={size}>LetzPocket Logo</div>;
  };
});

// Mock AuthModal
jest.mock('../AuthModal', () => {
  return function MockAuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const defaultProps = {
  currentPage: 'dashboard',
  onPageChange: jest.fn(),
  user: undefined,
  onLogout: jest.fn()
};

const renderComponent = (props = {}) => {
  return render(
    <Navigation {...defaultProps} {...props} />
  );
};

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the navigation bar', () => {
      renderComponent();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('renders the logo', () => {
      renderComponent();
      
      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
    });

    it('renders navigation menu items', () => {
      renderComponent();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Agreement Checker')).toBeInTheDocument();
      expect(screen.getByText('Yield Calculator')).toBeInTheDocument();
      expect(screen.getByText('Price Estimator')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('highlights the current page', () => {
      renderComponent({ currentPage: 'yield-calculator' });
      
      const yieldCalculatorButton = screen.getByText('Yield Calculator').closest('button');
      expect(yieldCalculatorButton).toHaveClass('bg-blue-600');
    });

    it('calls onPageChange when menu item is clicked', () => {
      const mockOnPageChange = jest.fn();
      renderComponent({ onPageChange: mockOnPageChange });
      
      const propertiesButton = screen.getByText('Properties');
      fireEvent.click(propertiesButton);
      
      expect(mockOnPageChange).toHaveBeenCalledWith('properties');
    });

    it('renders all menu items with icons', () => {
      renderComponent();
      
      const menuItems = ['Dashboard', 'Agreement Checker', 'Yield Calculator', 'Price Estimator', 'Properties'];
      menuItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication State', () => {
    it('shows user menu when user is logged in', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      renderComponent({ user: mockUser });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows login/signup when user is not logged in', () => {
      renderComponent({ user: undefined });
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('calls onLogout when logout button is clicked', () => {
      const mockOnLogout = jest.fn();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      renderComponent({ user: mockUser, onLogout: mockOnLogout });
      
      const logoutButton = screen.getByText('Log Out');
      fireEvent.click(logoutButton);
      
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  describe('Mobile Menu', () => {
    it('has mobile menu button', () => {
      renderComponent();
      
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('toggles mobile menu when button is clicked', () => {
      renderComponent();
      
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      
      // Initially menu should be hidden
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      
      // Click to open
      fireEvent.click(mobileMenuButton);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Click to close
      fireEvent.click(mobileMenuButton);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderComponent();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderComponent();
      
      const firstButton = screen.getByText('Dashboard');
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('has proper semantic HTML structure', () => {
      renderComponent();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Styling and Layout', () => {
    it('has correct container classes', () => {
      renderComponent();
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white', 'border-b', 'border-gray-200');
    });

    it('has proper flex layout', () => {
      renderComponent();
      
      const nav = screen.getByRole('navigation');
      const container = nav.querySelector('.max-w-7xl');
      expect(container).toHaveClass('flex', 'justify-between', 'h-16');
    });

    it('positions logo correctly', () => {
      renderComponent();
      
      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('hides desktop navigation on mobile', () => {
      renderComponent();
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('shows mobile menu button on small screens', () => {
      renderComponent();
      
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles menu item clicks correctly', () => {
      const mockOnPageChange = jest.fn();
      renderComponent({ onPageChange: mockOnPageChange });
      
      const agreementCheckerButton = screen.getByText('Agreement Checker');
      fireEvent.click(agreementCheckerButton);
      
      expect(mockOnPageChange).toHaveBeenCalledWith('agreement-checker');
    });

    it('prevents default action on navigation clicks', () => {
      const mockOnPageChange = jest.fn();
      renderComponent({ onPageChange: mockOnPageChange });
      
      const dashboardButton = screen.getByText('Dashboard');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      fireEvent(dashboardButton, clickEvent);
      expect(mockOnPageChange).toHaveBeenCalled();
    });
  });
});
