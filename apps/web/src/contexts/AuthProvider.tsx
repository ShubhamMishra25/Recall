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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
    setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const initAuth = async () => {
      // No token => not logged in
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/api/v1/auth/me");
        setUser(data);
      } catch (err) {
        console.error("Auth init failed:", err);

        setUser(null);
        setAccessTokenState(null);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
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
    const data = await apiFetch(
      `/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
    );
    setAccessTokenState(data.accessToken);
    setUser(data.user);

    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("accessToken", data.accessToken);

    setLoading(false);
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
    setLoading(false);
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout, verify, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
