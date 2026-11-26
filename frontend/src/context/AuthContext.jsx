import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('resq_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('resq_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/v1/auth/me');
        if (res.data && res.data.data && res.data.data.user) {
          setUser(res.data.data.user);
          localStorage.setItem('resq_user', JSON.stringify(res.data.data.user));
        }
      } catch (err) {
        console.warn('Session verification notice:', err.message);
        // If 401, clear credentials
        if (err.response && err.response.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('resq_token', receivedToken);
    localStorage.setItem('resq_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await api.post('/api/v1/auth/register', userData);
    const { token: receivedToken, user: receivedUser } = res.data.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('resq_token', receivedToken);
    localStorage.setItem('resq_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

