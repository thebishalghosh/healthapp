import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = async () => {
    await tokenStorage.remove();
    setUser(null);
  };

  const restoreSession = async () => {
    setLoading(true);
    try {
      const token = await tokenStorage.get();
      if (!token) return;

      const data = await api.me(token);
      setUser(data.user);
    } catch (error) {
      if (error.status === 401 || error.code === 'UNAUTHENTICATED') {
        await clearSession();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (!data.access_token || !data.user) {
      throw new Error('The server returned an invalid login response. Please try again.');
    }
    await tokenStorage.set(data.access_token);
    const currentUser = (await api.me(data.access_token)).user;
    setUser(currentUser);
    return currentUser;
  };

  const register = async (email, password, firstName, lastName) => {
    await api.register({ email, password, first_name: firstName, last_name: lastName });
    return login(email, password);
  };

  const logout = async () => {
    const token = await tokenStorage.get();
    try {
      if (token) await api.logout(token);
    } finally {
      await clearSession();
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    restoreSession,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}