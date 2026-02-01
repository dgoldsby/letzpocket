import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AgreementChecker from './components/AgreementChecker';
import YieldCalculator from './components/YieldCalculator';
import PriceEstimator from './components/PriceEstimator';
import Properties from './components/Properties';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  const renderCurrentPage = () => {
    // Show landing page if user is not authenticated
    if (!user) {
      return <LandingPage />;
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
      default:
        return <Dashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          user={user}
          onLogout={handleLogout}
        />
      )}
      <main className={user ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        {renderCurrentPage()}
      </main>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
