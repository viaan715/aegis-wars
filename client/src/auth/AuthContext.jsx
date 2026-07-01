import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'formforge_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await api.register({ email, password, name });
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const data = await api.me(token);
    setUser(data.user);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, refreshUser }),
    [token, user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
