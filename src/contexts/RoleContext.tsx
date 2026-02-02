import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, RoleContext, UserProfile } from '../types/auth';
import { authService } from '../services/auth';

const RoleContextProvider = createContext<RoleContext | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
  user: UserProfile | null;
}

export function RoleProvider({ children, user }: RoleProviderProps) {
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);

  // Set active role when user changes
  useEffect(() => {
    if (user && user.roles.length > 0) {
      setActiveRoleState(user.activeRole);
    } else {
      setActiveRoleState(null);
    }
  }, [user]);

  const setActiveRole = async (role: UserRole) => {
    if (!user) return;

    try {
      // Update in Firestore
      await authService.switchActiveRole(user.uid, role);
      // Update local state
      setActiveRoleState(role);
    } catch (error) {
      console.error('Failed to switch role:', error);
      throw error;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user ? authService.hasRole(user.roles, role) : false;
  };

  const hasPermission = (permission: string): boolean => {
    return user ? authService.hasPermission(user.roles, permission as any) : false;
  };

  const availableRoles = user ? user.roles : [];

  const contextValue: RoleContext = {
    activeRole: activeRole!,
    availableRoles,
    setActiveRole,
    hasRole,
    hasPermission
  };

  return (
    <RoleContextProvider.Provider value={contextValue}>
      {children}
    </RoleContextProvider.Provider>
  );
}

export function useRole(): RoleContext {
  const context = useContext(RoleContextProvider);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
