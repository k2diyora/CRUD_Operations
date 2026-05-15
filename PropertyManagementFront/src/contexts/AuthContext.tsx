import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { refreshTokenApi } from '../services/appservices';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null, refreshToken?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [refreshToken, setRefreshTokenState] = useState<string | null>(() => {
    return localStorage.getItem('refreshToken');
  });

  const setToken = useCallback((newToken: string | null, newRefreshToken?: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }

    if (newRefreshToken !== undefined) {
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
        setRefreshTokenState(newRefreshToken);
      } else {
        localStorage.removeItem('refreshToken');
        setRefreshTokenState(null);
      }
    } else if (!newToken) {
      localStorage.removeItem('refreshToken');
      setRefreshTokenState(null);
    }

    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null, null);
  }, [setToken]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [logout]);

  useEffect(() => {
    if (!token || !refreshToken) return;

    // Refresh every 30 minutes (token expires in 1 hour)
    const refreshInterval = setInterval(async () => {
      try {
        const data = await refreshTokenApi(refreshToken);
        setToken(data.token, data.refreshToken);
      } catch (err) {
        console.error('Failed to refresh token', err);
        logout();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken, setToken, logout]);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
