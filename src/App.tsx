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

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('landing');
      setShowLoginModal(false);
    } catch (error) {
      console.error('Logout failed:', error);
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
