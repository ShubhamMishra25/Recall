import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiFetch, setAccessToken } from "@/lib/api";
import { AuthContext } from "@/contexts/authContext";
import type { User } from "@/contexts/authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    localStorage.getItem("accessToken") || null,
  );

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
    setAccessToken(accessToken);
  }, [accessToken]);

  // On mount (or token change), if token exists but no user, fetch user profile
  useEffect(() => {
    if (accessToken && !user) {
      (async () => {
        try {
          const data = await apiFetch("/api/v1/auth/me");
          setUser(data);
        } catch {
          // Token invalid or expired, force logout
          setAccessTokenState(null);
          setUser(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      })();
    }
  }, [accessToken, user]);

  const login = async (email: string) => {
    await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const verify = async (token: string) => {
    const data = await apiFetch(
      `/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
    );
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const refresh = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");
    const data = await apiFetch("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    setAccessTokenState(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setAccessTokenState(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, logout, verify, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
