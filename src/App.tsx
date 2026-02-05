import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider, ROLE_CHANGE_EVENT } from './contexts/RoleContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AgreementChecker from './components/AgreementChecker';
import YieldCalculator from './components/YieldCalculator';
import PriceEstimator from './components/PriceEstimator';
import Properties from './components/Properties';
import LandingPage from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { trackPageView, PAGE_NAMES, trackEvent, EVENT_CATEGORIES, EVENT_ACTIONS, trackError } from './lib/analytics';

function AppContent() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('landing');
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  // Handle role changes
  React.useEffect(() => {
    const handleRoleChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { newRole } = customEvent.detail;
      console.log('AppContent: Role changed to', newRole);
      
      // Navigate based on new role
      if (newRole === 'ADMINISTRATOR') {
        setCurrentPage('admin');
        console.log('AppContent: Navigating to admin page');
      } else if (newRole === 'LANDLORD' || newRole === 'TENANT') {
        setCurrentPage('dashboard');
        console.log('AppContent: Navigating to dashboard');
      }
    };

    window.addEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    
    return () => {
      window.removeEventListener(ROLE_CHANGE_EVENT, handleRoleChange);
    };
  }, []);

  // Track page changes
  React.useEffect(() => {
    const pageNameMap: Record<string, string> = {
      'landing': PAGE_NAMES.HOME,
      'dashboard': PAGE_NAMES.DASHBOARD,
      'agreement-checker': PAGE_NAMES.AGREEMENT_REVIEW,
      'yield-calculator': PAGE_NAMES.YIELD_CALCULATOR,
      'price-estimator': PAGE_NAMES.PRICE_ESTIMATOR,
      'properties': PAGE_NAMES.PROPERTY_ANALYTICS,
      'admin': PAGE_NAMES.ADMIN_PANEL
    };

    const pageName = pageNameMap[currentPage] || PAGE_NAMES.HOME;
    trackPageView(pageName);
  }, [currentPage]);

  const handleLogout = async () => {
    try {
      trackEvent(EVENT_ACTIONS.LOGOUT, EVENT_CATEGORIES.AUTHENTICATION);
      await logout();
      setCurrentPage('landing');
      setShowLoginModal(false);
    } catch (error) {
      console.error('Logout failed:', error);
      trackError('logout_failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const renderCurrentPage = () => {
    // Show landing page if user is not authenticated
    if (!isAuthenticated) {
      return <LandingPage onLoginClick={() => setShowLoginModal(true)} />;
    }

    // Show authenticated pages
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'agreement-checker':
        return <AgreementChecker />;
      case 'yield-calculator':
        return <YieldCalculator />;
      case 'price-estimator':
        return <PriceEstimator />;
      case 'properties':
        return <Properties />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onPageChange={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lp-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && user && (
        <RoleProvider user={user}>
          <>
            <Navigation 
              currentPage={currentPage} 
              onPageChange={setCurrentPage}
              user={user}
              onLogout={handleLogout}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderCurrentPage()}
            </main>
          </>
        </RoleProvider>
      )}
      
      {!isAuthenticated && (
        <main>
          {renderCurrentPage()}
        </main>
      )}
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
