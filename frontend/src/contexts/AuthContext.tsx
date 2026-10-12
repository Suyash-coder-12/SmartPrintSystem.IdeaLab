import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, XeroxCenter, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  center: XeroxCenter | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (asRole: 'superadmin' | 'center' | 'customer') => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [center, setCenter] = useState<XeroxCenter | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartprint_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const savedToken = localStorage.getItem('smartprint_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        if (res.center) {
          setCenter(res.center);
        }
      }
    } catch (e) {
      console.warn('Session expired or invalid, continuing as guest:', e);
      localStorage.removeItem('smartprint_token');
      setToken(null);
      setUser(null);
      setRole('customer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        localStorage.setItem('smartprint_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setRole(res.user.role);
        if (res.center) {
          setCenter(res.center);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (asRole: 'superadmin' | 'center' | 'customer') => {
    if (asRole === 'customer') {
      logout();
      setRole('customer');
      return;
    }

    const credentials = asRole === 'superadmin'
      ? { email: 'admin@smartprint.com', password: 'admin123' }
      : { email: 'center@quickprint.com', password: 'center123' };

    await login(credentials.email, credentials.password);
  };

  const logout = () => {
    localStorage.removeItem('smartprint_token');
    setToken(null);
    setUser(null);
    setCenter(null);
    setRole('customer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        center,
        role,
        token,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
