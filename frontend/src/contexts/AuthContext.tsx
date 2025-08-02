import { useState, useEffect, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/services/api';
import type { User, LoginResponse } from '@/types';

console.log('🔥 AUTHCONTEXT MODULE LOADED - DEBUG VERSION');

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      const loginData = response.data as LoginResponse;
      const { user, accessToken } = loginData;
      localStorage.setItem('authToken', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      console.log('AuthContext initAuth:', { token: !!token, storedUser: !!storedUser });
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Parsed user data:', userData);
          setUser(userData);
          console.log('User restored from localStorage, state updated');
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } else {
        console.log('No token or user data found in localStorage');
      }
      setIsLoading(false);
      console.log('AuthContext initialization complete');
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = response.data.data;
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

