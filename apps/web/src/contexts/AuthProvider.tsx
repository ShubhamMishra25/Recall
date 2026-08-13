import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import {
  apiFetch,
  setAccessToken,
  setAuthFailureHandler,
  verifyMagicLink,
  logout as apiLogout,
  NetworkError,
} from "@/lib/api";
import { AuthContext } from "@/contexts/authContext";
import type { User } from "@/contexts/authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      setAccessTokenState(null);
      setLoading(false);
    });
  }, []);

  // Keep the module-level access token in sync with state
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  // Bootstrap: no stored token. If the HttpOnly refresh cookie exists, the
  // /me call 401s and apiFetch transparently refreshes via the cookie.
  useEffect(() => {
    const initAuth = async (attempt = 0) => {
      try {
        const data = await apiFetch("/api/v1/auth/me");
        setUser(data);
        setLoading(false);
      } catch (err) {
        if (err instanceof NetworkError && attempt < 5) {
          setTimeout(() => initAuth(attempt + 1), 1500);
          return;
        }

        setUser(null);
        setAccessTokenState(null);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string) => {
    await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const verify = useCallback(async (token: string) => {
    const data = await verifyMagicLink(token);
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    // Best-effort: revoke the session server-side (clears the cookie too),
    // then clear local state regardless of network outcome
    apiLogout().catch(() => {});
    setUser(null);
    setAccessTokenState(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout, verify }}
    >
      {children}
    </AuthContext.Provider>
  );
}