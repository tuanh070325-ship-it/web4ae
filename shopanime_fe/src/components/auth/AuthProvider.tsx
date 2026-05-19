import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiGet, apiPost, clearAuthToken, getAuthToken, setAuthToken } from "../../lib/api";
import type { ApiResponse, AuthSession, User } from "../../lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: { username: string; email: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: AuthSession) => {
    setAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiGet<ApiResponse<User>>("/auth/me", { suppressUnauthorizedEvent: true });
      setUser(response.data);
      setToken(getAuthToken());
    } catch (err) {
      clearAuthToken();
      setUser(null);
      setToken(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error("Unable to refresh auth session:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("akibacore:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("akibacore:unauthorized", handleUnauthorized);
  }, [refreshMe]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const response = await apiPost<ApiResponse<AuthSession>>("/auth/login", input);
    applySession(response.data);
    return response.data.user;
  }, [applySession]);

  const register = useCallback(async (input: { username: string; email: string; password: string; full_name?: string }) => {
    const response = await apiPost<ApiResponse<AuthSession>>("/auth/register", input);
    applySession(response.data);
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await apiPost("/auth/logout", undefined, { suppressUnauthorizedEvent: true });
      }
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error("Unable to complete logout request:", err);
      }
    } finally {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: ["ADMIN", "MANAGER"].includes(user?.role?.toUpperCase() ?? ""),
    login,
    register,
    logout,
    refreshMe,
  }), [loading, login, logout, refreshMe, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
