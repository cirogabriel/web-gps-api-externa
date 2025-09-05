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
    https: false,              // FORZAR HTTP (no HTTPS)
    headers: {
      // HEADERS CRÍTICOS PARA FORZAR GPS EN HTTP
      'Permissions-Policy': 'geolocation=*, camera=*, microphone=*, accelerometer=*, gyroscope=*',
      'Feature-Policy': 'geolocation *; camera *; microphone *; accelerometer *; gyroscope *',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      // FORZAR PERMISOS SIN HTTPS
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'X-Frame-Options': 'ALLOWALL',
      // PERMITIR CONTENIDO INSEGURO PARA GPS
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; connect-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; geolocation-src *;",
      // HEADERS ESPECÍFICOS PARA GPS EN HTTP
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'X-Content-Type-Options': 'nosniff'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5678,
    cors: true,
    https: false,              // FORZAR HTTP también en preview
    headers: {
      // MISMOS HEADERS PARA PREVIEW/PRODUCTION
      'Permissions-Policy': 'geolocation=*, camera=*, microphone=*, accelerometer=*, gyroscope=*',
      'Feature-Policy': 'geolocation *; camera *; microphone *; accelerometer *; gyroscope *',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  define: {
    // Variables globales para forzar contexto seguro
    global: 'globalThis',
  }
})
