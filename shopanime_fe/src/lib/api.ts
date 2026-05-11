const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000/api'
).replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'akibacore.authToken';

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
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

async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...init, headers });
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
      window.dispatchEvent(new Event('akibacore:unauthorized'));
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function apiGet<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}
