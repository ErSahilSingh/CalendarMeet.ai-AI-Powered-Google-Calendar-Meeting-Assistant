import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AuthContextType } from '../models/auth';

const STORAGE_KEY = 'calendar_meet_user';

const DEFAULT_MOCK_USER: UserProfile = {
  id: 'usr_g_88492041',
  name: 'Sahil Sharma',
  email: 'sahil.sharma@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  provider: 'google',
  calendarName: 'Google Calendar (Primary)',
  connectedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted user if any
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse auth cache:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    // Simulate realistic Google OAuth roundtrip latency
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(DEFAULT_MOCK_USER);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_USER));
        } catch (e) {
          console.error('Failed to persist user:', e);
        }
        setIsLoading(false);
        resolve();
      }, 650);
    });
  };

  const logout = (): void => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove auth cache:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        logout,
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
