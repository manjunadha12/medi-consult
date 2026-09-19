import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

// Critical Polyfills for mobile environment & WebRTC libraries
if (typeof window.global === 'undefined') {
  window.global = window;
}

if (typeof window.process === 'undefined') {
  window.process = { env: { NODE_ENV: 'development' }, browser: true };
}

// Robust Buffer mock to prevent "Illegal constructor" or crashes in bundled environments
if (typeof window.Buffer === 'undefined') {
  const BufferMock = function() {
    return [];
  };
  BufferMock.isBuffer = () => false;
  BufferMock.from = () => [];
  BufferMock.alloc = () => [];
  window.Buffer = BufferMock;
}

// Global scope fallback for BACKEND_URL to prevent CORE_CRASH ReferenceErrors
if (typeof window.BACKEND_URL === 'undefined') {
  const getDevPcIp = () => {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('DEV_PC_IP')) {
      return window.localStorage.getItem('DEV_PC_IP');
    }
    return '10.129.146.15';
  };
  const DEV_PC_IP = getDevPcIp();
  const BACKEND_PORT = '5001';
  const isNative = window.location.origin.startsWith('capacitor:') ||
                  (window.location.origin.includes('://localhost') && !window.location.port);
  window.BACKEND_URL = isNative ? `http://${DEV_PC_IP}:${BACKEND_PORT}` : '';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
)
