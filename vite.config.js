import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',           // Permite acceso desde IP pública
    port: 5678,
    open: false,
    cors: true,                // Habilitar CORS
    strictPort: false,         // Permite cambiar puerto si está ocupado
    headers: {
      // Headers críticos para GPS en HTTP
      'Permissions-Policy': 'geolocation=*, camera=*, microphone=*',
      'Feature-Policy': 'geolocation *; camera *; microphone *',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      // Forzar contexto seguro para GPS
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; connect-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *;",
      // Headers adicionales para PWA
      'X-Frame-Options': 'ALLOWALL',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5678,
    cors: true
  },
  define: {
    // Variables globales para forzar contexto seguro
    global: 'globalThis',
  }
})
