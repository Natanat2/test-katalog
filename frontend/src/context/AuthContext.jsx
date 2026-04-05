import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchCurrentUser, loginUser, registerUser, clearAccessToken } from '../services/api';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getStoredJSON,
  getStoredValue,
  removeStoredValue,
  setStoredJSON
} from '../utils/helpers';

const AuthContext = createContext(null);

function persistUser(user) {
  if (user) {
    setStoredJSON(AUTH_USER_KEY, user);
    return;
  }
  removeStoredValue(AUTH_USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredJSON(AUTH_USER_KEY, null));
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const accessToken = getStoredValue(AUTH_TOKEN_KEY);
    if (!accessToken) {
      setUser(null);
      persistUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      persistUser(currentUser);
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 0;
      const shouldLogout = status === 401 || status === 403;

      if (shouldLogout) {
        clearAccessToken();
        setUser(null);
        persistUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const payload = await loginUser(credentials);
    setUser(payload.user);
    persistUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (credentials) => {
    const payload = await registerUser(credentials);
    setUser(payload.user);
    persistUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    persistUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      restoreSession
    }),
    [user, isLoading, login, register, logout, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
