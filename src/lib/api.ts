import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_GET_RETRIES = 2;

const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retryCount?: number };

function isIdempotentGet(config?: AxiosRequestConfig): boolean {
  const method = (config?.method || 'get').toLowerCase();
  return method === 'get' || method === 'head';
}

function shouldRetry(error: AxiosError): boolean {
  if (!error.config || !isIdempotentGet(error.config)) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  const status = error.response?.status;
  if (status && status < 500 && status !== 408 && status !== 429) return false;

  // Network / timeout errors have no response
  if (!error.response) return true;
  return status === 408 || status === 429 || (typeof status === 'number' && status >= 500);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.reject(
      Object.assign(new Error('You appear to be offline. Check your connection and try again.'), {
        code: 'ERR_OFFLINE',
        config,
        isAxiosError: true,
      }),
    );
  }

  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.timeout == null) {
    config.timeout = DEFAULT_TIMEOUT_MS;
  }
  return config;
});

// Handle auth errors + bounded GET retries
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401) {
      Cookies.remove('access_token', { path: '/' });
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (config && shouldRetry(error)) {
      const retryCount = config._retryCount ?? 0;
      if (retryCount < MAX_GET_RETRIES) {
        config._retryCount = retryCount + 1;
        await sleep(300 * (retryCount + 1));
        return api.request(config);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
    if (error.code === 'ERR_OFFLINE') {
      return error.message;
    }
    if (!error.response) {
      return 'Unable to reach the server. Please try again.';
    }
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      return String((detail as { message: string }).message);
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
