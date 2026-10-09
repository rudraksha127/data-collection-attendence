"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, getAccessToken, setAccessToken, setUnauthorizedHandler } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import type { AuthUser } from "@/types/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setStatus("unauthenticated");
      return;
    }
    try {
      const me = await api.getCurrentUser();
      setUser(me);
      setStatus("authenticated");
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) clearSession();
      else if (err instanceof ApiError && err.isNetwork) {
        // keep existing session on transient network failure
        setStatus((prev) => (prev === "loading" ? "unauthenticated" : prev));
      } else clearSession();
    }
  }, [clearSession]);

  // Bootstrap session on mount (deferred so state updates happen outside the effect body)
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  // Single global 401 handler — avoids redirect loops
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setError(null);
    try {
      const result = await api.login(email, password);
      setAccessToken(result.access_token);
      setUser(result.user);
      setStatus("authenticated");
      return result.user;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.code === "INVALID_CREDENTIALS"
            ? "Invalid email or password."
            : err.isNetwork
              ? "Cannot reach the server. Check your connection."
              : err.message
          : "Login failed. Please try again.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // logout is best-effort; clear local session regardless
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, error, login, logout, refresh }),
    [user, status, error, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
