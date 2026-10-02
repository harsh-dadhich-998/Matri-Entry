export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// In production on separate hosts, set VITE_API_URL in frontend env (e.g., https://my-api.onrender.com).
// If empty, it defaults to relative `/api`, which works with Vite proxy in dev or reverse proxies in prod.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const SESSION_TOKEN_KEY = 'matrientry_session_token';

function getSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setSessionToken(token: string) {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Cookie authentication can still work when storage is unavailable.
  }
}

type LoadingListener = (busy: boolean) => void;
const loadingListeners = new Set<LoadingListener>();
let inFlight = 0;

export function subscribeApiLoading(listener: LoadingListener) {
  loadingListeners.add(listener);
  listener(inFlight > 0);
  return () => {
    loadingListeners.delete(listener);
  };
}

function setInFlight(delta: number) {
  inFlight = Math.max(0, inFlight + delta);
  const busy = inFlight > 0;
  loadingListeners.forEach((listener) => listener(busy));
}

function isSilentRequest(path: string, method?: string) {
  return path === '/auth/session' && (!method || method === 'GET');
}

export async function apiRequest<T = any>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const silent = isSilentRequest(path, options.method);
  if (!silent) setInFlight(1);
  try {
    const token = getSessionToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/api${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && path !== '/auth/login') setSessionToken('');
      throw new ApiError(
        typeof payload?.error === 'string'
          ? payload.error
          : 'The request could not be completed.',
        response.status,
      );
    }
    if (path === '/auth/login' && typeof payload?.sessionToken === 'string')
      setSessionToken(payload.sessionToken);
    if (path === '/auth/logout') setSessionToken('');
    return payload as T;
  } finally {
    if (!silent) setInFlight(-1);
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : 'The request failed. Please try again.';
