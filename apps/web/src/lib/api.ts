let _accessToken: string | null = null;
let _refreshPromise: Promise<string> | null = null;
let _onAuthFailure: (() => void) | null = null;

// Access token lives in memory only — never persisted. The refresh token is
// an HttpOnly cookie that JS cannot read.
export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function setAuthFailureHandler(handler: () => void) {
  _onAuthFailure = handler;
}

export async function refresh(): Promise<string> {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

// Single-flight: concurrent 401s share one in-flight refresh call
function getOrCreateRefresh(): Promise<string> {
  if (!_refreshPromise) {
    _refreshPromise = refresh().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

// lib/api.ts

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
  // The response shape is unknown at this boundary; callers type their own
  // endpoint results.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const token = _accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    // Server unreachable (not yet up, dropped connection, offline, etc).
    // This is NOT an auth failure — don't touch tokens.
    throw new NetworkError(`Could not reach server: ${path}`);
  }

  if (res.status === 401 && !_isRetry && !path.includes("/auth/refresh")) {
    try {
      await getOrCreateRefresh();
    } catch {
      setAccessToken(null);
      _onAuthFailure?.();
      throw new Error("Session expired");
    }
    return apiFetch(path, options, true);
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${res.status} ${error}`);
  }
  return res.json();
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// --- Auth and Atoms Endpoints ---
// --- New FSRS Review Endpoints ---

export async function getTodayReviewQueue() {
  return apiFetch("/api/v1/review/today", { method: "GET" });
}

export async function getAtom(atomId: string) {
  return apiFetch(`/api/v1/atoms/${atomId}`, { method: "GET" });
}

export async function gradeAtom(atomId: string, grade: number) {
  return apiFetch("/api/v1/review/grade", {
    method: "POST",
    body: JSON.stringify({ atomId, grade }),
  });
}

export async function getReviewStats() {
  return apiFetch("/api/v1/review/stats", { method: "GET" });
}

export async function verifyMagicLink(token: string) {
  return apiFetch("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function logout() {
  return apiFetch("/api/v1/auth/logout", {
    method: "POST",
  });
}

export async function searchAtoms(query: string) {
  // We use encodeURIComponent to safely handle spaces and special characters in the URL
  return apiFetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
  });
}

export async function getDailySerendipity() {
  return apiFetch('/api/v1/serendipity', { method: 'GET' });
}

export async function getVoiceUploadUrl() {
  return apiFetch('/api/v1/upload/voice-url', { method: 'POST' });
}

export async function getPdfUploadUrl(fileName: string) {
  return apiFetch('/api/v1/upload/pdf-url', { 
    method: 'POST',
    body: JSON.stringify({ fileName }) 
  });
}

export async function getImageUploadUrl(fileName: string) {
  return apiFetch('/api/v1/upload/image-url', {
    method: 'POST',
    body: JSON.stringify({ fileName })
  });
}

export async function createVoiceAtom(fileUrl: string) {
  return apiFetch('/api/v1/atoms/voice', {
    method: 'POST',
    body: JSON.stringify({ fileUrl })
  })
}

export async function createArticleAtom(url: string) {
  return apiFetch('/api/v1/atoms/article', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function createPdfAtom(fileUrl: string, fileName: string) {
  return apiFetch('/api/v1/atoms/pdf', {
    method: 'POST',
    body: JSON.stringify({ fileUrl, fileName }),
  });
}

export async function createImageAtom(fileUrl: string, fileName: string) {
  return apiFetch('/api/v1/atoms/image', {
    method: 'POST',
    body: JSON.stringify({ fileUrl, fileName }),
  });
}