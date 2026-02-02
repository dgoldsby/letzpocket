import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, AuthState } from '../types/auth';
import { authService } from '../services/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: any) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: !!user
      });
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.login({ email, password });
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true
      });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isAuthenticated: false
      }));
      throw error;
    }
  };

  const register = async (data: any): Promise<UserProfile> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.register(data);
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true
      });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isAuthenticated: false
      }));
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<UserProfile> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.signInWithGoogle();
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true
      });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isAuthenticated: false
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await authService.logout();
      setAuthState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.user) return;
    
    try {
      const refreshedUser = await authService.refreshUserProfile(authState.user.uid);
      if (refreshedUser) {
        setAuthState(prev => ({
          ...prev,
          user: refreshedUser
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
