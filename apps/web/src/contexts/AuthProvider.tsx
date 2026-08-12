import { useState, useEffect } from "react";
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
  const [accessToken, setAccessTokenState] = useState<string | null>(
    localStorage.getItem("accessToken") || null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      setAccessTokenState(null);
      setLoading(false);
    });
  }, []);

  // Keep the module-level token and localStorage in sync with state
  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const initAuth = async (attempt = 0) => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/api/v1/auth/me");
        setUser(data);
        setLoading(false);
      } catch (err) {
        if (err instanceof NetworkError && attempt < 5) {
          setTimeout(() => initAuth(attempt + 1), 1500);
          return;
        }

        console.error("Auth init failed:", err);
        setUser(null);
        setAccessTokenState(null);
        localStorage.removeItem("refreshToken");
        setLoading(false);
      }
    };

    initAuth();
  }, [accessToken]);

  const login = async (email: string) => {
    await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const verify = async (token: string) => {
    const data = await verifyMagicLink(token);
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    localStorage.setItem("refreshToken", data.refreshToken);
    setLoading(false);
  };

  const logout = () => {
    // Best-effort: revoke the session server-side, then clear local state
    apiLogout().catch(() => {});
    setUser(null);
    setAccessTokenState(null);
    setLoading(false);
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout, verify }}
    >
      {children}
    </AuthContext.Provider>
  );
}
