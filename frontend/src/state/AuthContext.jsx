import React, { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'skillsignal.auth';

function readStoredAuth() {
  try {
    const storedAuth = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!storedAuth?.role || !storedAuth?.email || storedAuth.token !== 'cookie') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return storedAuth;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function asSessionAuth(auth) {
  return auth ? { ...auth, token: 'cookie' } : null;
}

async function primeCsrfCookie() {
  await apiRequest('/api/auth/csrf').catch(() => {});
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  async function login(email, password) {
    const nextAuth = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const sessionAuth = asSessionAuth(nextAuth);
    await primeCsrfCookie();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionAuth));
    setAuth(sessionAuth);
  }

  async function register(form) {
    const nextAuth = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const sessionAuth = asSessionAuth(nextAuth);
    await primeCsrfCookie();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionAuth));
    setAuth(sessionAuth);
  }

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  function updateAuth(nextAuth) {
    const sessionAuth = asSessionAuth(nextAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionAuth));
    setAuth(sessionAuth);
  }

  const value = useMemo(
    () => ({
      user: auth,
      token: auth?.token,
      login,
      register,
      logout,
      updateAuth,
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
