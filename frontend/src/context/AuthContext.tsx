import React, { createContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: authUser, access_token, refresh_token } = response.data.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(authUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/auth/signup', { email, password, name });
      const { user: authUser, access_token, refresh_token } = response.data.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(authUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Signup failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
