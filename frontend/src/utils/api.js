import axios from 'axios';

/**
 * [MOBILE HANDSHAKE CONFIG]
 * Your computer's local IP for development.
 * IMPORTANT: If you are testing on a real Android device, change this
 * to your computer's CURRENT IP address (run 'ipconfig' in cmd).
 */
const DEV_PC_IP = '192.168.1.17';
const BACKEND_PORT = '5001';

const getIsNative = () => {
  if (typeof window === 'undefined') return false;
  const { origin, hostname } = window.location;
  // Capacitor uses 'https://localhost' or 'capacitor://localhost'
  // PC Dev uses 'http://localhost:5173'
  return origin.startsWith('capacitor:') ||
         origin.includes('://localhost') && !window.location.port;
};

const isNative = getIsNative();

const getBaseURL = () => {
  if (typeof window === 'undefined') return '/api';
  // On mobile, we use the absolute IP of your PC. In browser, we use the Vite proxy.
  return isNative ? `http://${DEV_PC_IP}:${BACKEND_PORT}/api` : '/api';
};

export const getBackendURL = () => {
  if (typeof window === 'undefined') return `http://localhost:${BACKEND_PORT}`;
  // Use 5001 for Sockets too on mobile to avoid SSL handshake hangs
  return isNative ? `http://${DEV_PC_IP}:5001` : '';
};

export const BACKEND_URL = getBackendURL();

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
