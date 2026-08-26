import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const sslKey = path.resolve(import.meta.dirname, '../backend/key.pem');
const sslCert = path.resolve(import.meta.dirname, '../backend/cert.pem');
const isHttpsEnabled = process.env.VITE_HTTPS !== 'false' && fs.existsSync(sslKey) && fs.existsSync(sslCert);
const targetBackend = isHttpsEnabled ? 'https://127.0.0.1:5000' : 'http://127.0.0.1:5001';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'framer-motion',
      'axios',
      'zustand',
      'socket.io-client'
    ]
  },
  define: {
    global: 'globalThis',
  },
  server: {
    ...(isHttpsEnabled ? {
      https: {
        key: sslKey,
        cert: sslCert,
      }
    } : {}),
    host: '0.0.0.0',   // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: targetBackend,
        changeOrigin: true,
        secure: false, // Allow self-signed certs
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (res && !res.headersSent && (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET')) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Backend node initializing...' }));
            }
          });
        }
      },
      '/socket.io': {
        target: targetBackend,
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => {
            // Suppress transient WebSocket proxy error logs during backend restart
          });
        }
      },
      '/uploads': {
        target: targetBackend,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
