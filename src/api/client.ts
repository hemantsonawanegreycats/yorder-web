import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.ywsglobal.com';

const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'yorder_web_auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let guestTokenPromise: Promise<string | null> | null = null;

export const ensureGuestToken = async (): Promise<string | null> => {
  const token = getStoredToken();
  if (token) return token;

  if (!guestTokenPromise) {
    guestTokenPromise = (async () => {
      try {
        const resp = await publicClient.post('/auth/user/guest/login', {});
        if (resp.data && resp.data.token) {
          const newToken = resp.data.token;
          setStoredToken(newToken);
          return newToken;
        }
      } catch (err) {
        console.error('Auto guest login error:', err);
      } finally {
        guestTokenPromise = null;
      }
      return null;
    })();
  }
  return guestTokenPromise;
};

apiClient.interceptors.request.use(async (config) => {
  let token = getStoredToken();
  if (!token) {
    token = await ensureGuestToken();
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      removeStoredToken();
    }
    return Promise.reject(error);
  }
);
