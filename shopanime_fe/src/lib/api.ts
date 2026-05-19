const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000/api'
).replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'akibacore.authToken';

export interface ApiRequestOptions extends RequestInit {
  suppressUnauthorizedEvent?: boolean;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function apiRequest<T = unknown>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  const { suppressUnauthorizedEvent, ...requestInit } = init;
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...requestInit, headers });
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      message = Array.isArray(errorBody.message) ? errorBody.message.join(', ') : errorBody.message || message;
    } catch {
      // Keep default message when the server does not return JSON.
    }
    if (response.status === 401) {
      clearAuthToken();
      if (!suppressUnauthorizedEvent && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('akibacore:unauthorized'));
      }
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function apiGet<T = unknown>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, init);
}

export function apiPost<T = unknown>(path: string, body?: unknown, init: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPut<T = unknown>(path: string, body?: unknown, init: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...init,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T = unknown>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'DELETE' });
}
