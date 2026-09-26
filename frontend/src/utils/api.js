import axios from 'axios';

/**
 * [MOBILE HANDSHAKE CONFIG]
 * Current PC IPv4 Address: 192.168.1.7
 */
const getDevPcIp = () => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('DEV_PC_IP')) {
    return window.localStorage.getItem('DEV_PC_IP');
  }
  return '192.168.1.7';
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

const resolveMobileBackendUrl = () => {
  const target = getDevPcIp();
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return target.replace(/\/$/, '');
  }
  return `${PROTOCOL}://${target}:${BACKEND_PORT}`;
};

const getBaseURL = () => {
  if (typeof window === 'undefined') return '/api';
  if (isNative) {
    return `${resolveMobileBackendUrl()}/api`;
  }
  return '/api';
};

export const getBackendURL = () => {
  if (typeof window === 'undefined') return `${PROTOCOL}://localhost:${BACKEND_PORT}`;
  return isNative ? resolveMobileBackendUrl() : '';
};

export const BACKEND_URL = getBackendURL();

export const enforceHighQualityVideo = (pc) => {
  if (!pc) return;
  try {
    const senders = pc.getSenders();
    senders.forEach((sender) => {
      if (sender.track && sender.track.kind === 'video') {
        const parameters = sender.getParameters() || {};
        if (!parameters.encodings || parameters.encodings.length === 0) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = 4000000; // 4 Mbps for crystal clear HD
        parameters.encodings[0].maxFramerate = 30;
        parameters.encodings[0].scaleResolutionDownBy = 1.0;
        parameters.degradationPreference = 'maintain-resolution';

        sender.setParameters(parameters)
          .then(() => console.log("🎥 [WEBRTC] Enforced 1080p/720p HD Maintain-Resolution Mode"))
          .catch(e => console.warn("[WEBRTC_BITRATE_NOTICE]", e));
      }
    });
  } catch (err) {
    console.warn("[WEBRTC_QUALITY_NOTICE]", err);
  }
};

export const ICE_SERVERS = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
      'stun:openrelay.metered.ca:80',
      'stun:openrelay.metered.ca:443',
      'stun:stun.cloudflare.com:3478'
    ]
  },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
      'turns:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
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
