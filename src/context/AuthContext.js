import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';
import { normalizeProfile } from '../services/profile';
import { normalizeNutrition } from '../services/nutrition';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState(null);

  const clearSession = async () => {
    await tokenStorage.remove();
    setUser(null);
    setProfile(null);
    setNutrition(null);
  };

  const refreshProfile = useCallback(async (providedToken) => {
    const token = providedToken || await tokenStorage.get();
    if (!token) return null;

    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await api.getHealthProfile(token);
      const nextProfile = normalizeProfile(data);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      setProfileError(error);
      if (error.status === 401 || error.code === 'UNAUTHENTICATED') await clearSession();
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const calculateNutrition = useCallback(async (providedToken) => {
    const token = providedToken || await tokenStorage.get();
    if (!token) return null;
    setNutritionLoading(true);
    setNutritionError(null);
    try {
      await api.calculateNutrition(token);
      const nextNutrition = normalizeNutrition(await api.getNutrition(token));
      setNutrition(nextNutrition);
      return nextNutrition;
    } catch (error) {
      setNutritionError(error);
      if (error.status === 401 || error.code === 'UNAUTHENTICATED') await clearSession();
      throw error;
    } finally {
      setNutritionLoading(false);
    }
  }, []);

  const refreshNutrition = useCallback(async (providedToken) => {
    const token = providedToken || await tokenStorage.get();
    if (!token) return null;
    setNutritionLoading(true);
    setNutritionError(null);
    try {
      const data = await api.getNutrition(token);
      const nextNutrition = normalizeNutrition(data);
      setNutrition(nextNutrition);
      return nextNutrition;
    } catch (error) {
      setNutrition(null);
      setNutritionError(error);
      if (error.status === 401 || error.code === 'UNAUTHENTICATED') await clearSession();
      throw error;
    } finally {
      setNutritionLoading(false);
    }
  }, [calculateNutrition]);

  const updateProfile = useCallback(async (body) => {
    const token = await tokenStorage.get();
    if (!token) throw new Error('Authentication is required to update your profile.');
    await api.updateHealthProfile(token, body);
    setNutrition(null);
    const nextProfile = await refreshProfile(token);
    if (nextProfile.completion === 100) await calculateNutrition(token);
    return nextProfile;
  }, [calculateNutrition, refreshProfile]);

  const restoreSession = async () => {
    setLoading(true);
    try {
      const token = await tokenStorage.get();
      if (!token) return;

      const data = await api.me(token);
      setUser(data.user);
      try { await refreshProfile(token); } catch (error) { }
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
    try { await refreshProfile(data.access_token); } catch (error) { }
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
    profile,
    profileLoading,
    profileError,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    restoreSession,
    refreshProfile,
    updateProfile,
    nutrition,
    nutritionLoading,
    nutritionError,
    refreshNutrition,
    calculateNutrition,
  }), [user, profile, profileLoading, profileError, loading, updateProfile, nutrition, nutritionLoading, nutritionError, refreshNutrition, calculateNutrition]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}