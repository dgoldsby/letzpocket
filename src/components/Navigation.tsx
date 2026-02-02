import React, { useState } from 'react';
import { Building2, FileText, Calculator, TrendingUp, Home, Menu, X, User, LogOut, ChevronDown, Settings, Shield } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';
import { UserProfile } from '../types/auth';
import { useRole } from '../contexts/RoleContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: UserProfile;
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { activeRole, availableRoles, setActiveRole } = useRole();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'agreement-checker', label: 'Agreement Checker', icon: FileText },
    { id: 'yield-calculator', label: 'Yield Calculator', icon: Calculator },
    { id: 'price-estimator', label: 'Price Estimator', icon: TrendingUp },
    { id: 'properties', label: 'Properties', icon: Building2 },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo size="small" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => onPageChange(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              {/* Role Switcher for users with multiple roles */}
              {availableRoles.length > 1 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {activeRole}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {showRoleDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="py-1">
                        {availableRoles.map((role) => {
                          const getRoleIcon = (role: string) => {
                            switch (role) {
                              case 'ADMINISTRATOR':
                                return <Shield className="h-4 w-4 text-red-600" />;
                              case 'LANDLORD':
                                return <Building2 className="h-4 w-4 text-green-600" />;
                              case 'TENANT':
                                return <User className="h-4 w-4 text-blue-600" />;
                              case 'OPERATOR':
                                return <Settings className="h-4 w-4 text-yellow-600" />;
                              default:
                                return <User className="h-4 w-4 text-gray-600" />;
                            }
                          };

                          return (
                            <button
                              key={role}
                              onClick={() => {
                                setActiveRole(role);
                                setShowRoleDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                activeRole === role ? 'bg-gray-100 font-medium' : ''
                              }`}
                            >
                              {getRoleIcon(role)}
                              <span>{role}</span>
                              {activeRole === role && <span className="ml-auto text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.profile.firstName} {user.profile.lastName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            
            {user && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600 px-3 py-2">
                  <User className="h-4 w-4" />
                  <span>{user.profile.firstName} {user.profile.lastName}</span>
                </div>
                
                {/* Role Switcher for mobile */}
                {availableRoles.length > 1 && (
                  <div className="px-3 py-2">
                    <div className="text-sm text-gray-600 mb-2">Switch Role:</div>
                    {availableRoles.map((role) => {
                      const getRoleIcon = (role: string) => {
                        switch (role) {
                          case 'ADMINISTRATOR':
                            return <Shield className="h-4 w-4 text-red-600" />;
                          case 'LANDLORD':
                            return <Building2 className="h-4 w-4 text-green-600" />;
                          case 'TENANT':
                            return <User className="h-4 w-4 text-blue-600" />;
                          case 'OPERATOR':
                            return <Settings className="h-4 w-4 text-yellow-600" />;
                          default:
                            return <User className="h-4 w-4 text-gray-600" />;
                        }
                      };

                      return (
                        <Button
                          key={role}
                          variant={activeRole === role ? "default" : "ghost"}
                          onClick={() => {
                            setActiveRole(role);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start flex items-center space-x-2 mb-1"
                        >
                          {getRoleIcon(role)}
                          <span>{role}</span>
                          {activeRole === role && <span className="ml-auto text-xs">✓</span>}
                        </Button>
                      );
                    })}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    onLogout?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
