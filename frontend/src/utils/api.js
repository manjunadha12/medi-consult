import axios from 'axios';

/**
 * [MOBILE HANDSHAKE CONFIG]
 * Current PC IPv4 Address: 10.129.146.15
 */
const getDevPcIp = () => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('DEV_PC_IP')) {
    return window.localStorage.getItem('DEV_PC_IP');
  }
  return '10.129.146.15';
};

const DEV_PC_IP = getDevPcIp();
const BACKEND_PORT = '5001';
const PROTOCOL = 'http';

const getIsNative = () => {
  if (typeof window === 'undefined') return false;
  const { origin, hostname } = window.location;
  // Capacitor uses 'https://localhost' or 'capacitor://localhost'
  return origin.startsWith('capacitor:') ||
         (origin.includes('://localhost') && !window.location.port);
};

const isNative = getIsNative();

const getBaseURL = () => {
  if (typeof window === 'undefined') return '/api';
  // On mobile native, connect via HTTP to PC IP on Port 5001
  return isNative ? `${PROTOCOL}://${DEV_PC_IP}:${BACKEND_PORT}/api` : '/api';
};

export const getBackendURL = () => {
  if (typeof window === 'undefined') return `${PROTOCOL}://localhost:${BACKEND_PORT}`;
  return isNative ? `${PROTOCOL}://${DEV_PC_IP}:${BACKEND_PORT}` : '';
};

export const BACKEND_URL = getBackendURL();

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelay',
    credential: 'openrelay'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelay',
    credential: 'openrelay'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelay',
    credential: 'openrelay'
  }
];

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediconsult_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API_GLOBAL_ERROR]: ${error.config?.method?.toUpperCase()} ${error.config?.url} ->`, error.response?.status, error.response?.data || error.message);

    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isAuthRequest = error.config?.url?.includes('/auth/me');

    if (error.response?.status === 401 && !isLoginRequest && !isAuthRequest) {
      console.warn("[AUTH] Session compromised or expired. Purging local identity nodes.");
      localStorage.removeItem('mediconsult_token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
