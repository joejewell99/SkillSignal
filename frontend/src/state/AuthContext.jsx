import React, { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'skillsignal.auth';

function readStoredAuth() {
  try {
    const storedAuth = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!storedAuth?.token || !storedAuth?.role || !storedAuth?.email) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return storedAuth;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  async function login(email, password) {
    const nextAuth = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }

  async function register(form) {
    const nextAuth = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  const value = useMemo(
    () => ({
      user: auth,
      token: auth?.token,
      login,
      register,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
