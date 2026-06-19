let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const token = _accessToken ?? localStorage.getItem("accessToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${res.status} ${error}`);
  }
  return res.json();
}
