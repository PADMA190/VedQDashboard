import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Access token is held in module scope (in-memory) and synced from Redux.
let accessToken = null;
let onUnauthorized = null;
let refreshAccessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function configureAuthHooks({ onUnauthorized: unauth, refresh }) {
  onUnauthorized = unauth || null;
  refreshAccessToken = refresh || null;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // refresh-token cookie
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    // Don't try to refresh on the refresh endpoint itself or after a retry.
    const isRefreshEndpoint = (original.url || '').includes('/auth/refresh');
    const alreadyRetried = original._retry === true;

    if (status === 401 && !isRefreshEndpoint && !alreadyRetried && refreshAccessToken) {
      original._retry = true;
      try {
        // Coalesce concurrent 401s onto a single refresh call.
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(original);
        }
      } catch {
        // fall through to unauthorized
      }
      if (onUnauthorized) onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export function unwrapApiError(error) {
  const payload = error?.response?.data?.error;
  if (payload?.message) {
    return {
      message: payload.message,
      code: payload.code,
      details: payload.details,
      status: error.response?.status,
    };
  }
  return {
    message: error?.message || 'Network error',
    code: 'NETWORK_ERROR',
    status: error?.response?.status || 0,
  };
}
