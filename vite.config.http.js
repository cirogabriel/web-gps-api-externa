export default {
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: false, // FORZAR HTTP
    // Configuraciones para que el GPS funcione en HTTP
    headers: {
      'Permissions-Policy': 'geolocation=*',
      'Feature-Policy': 'geolocation *',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    // Permitir acceso inseguro para GPS
    allowInsecureContext: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    https: false,
    headers: {
      'Permissions-Policy': 'geolocation=*',
      'Feature-Policy': 'geolocation *'
    }
  },
  // Configuraciones para desarrollo
  define: {
    // Variables que ayudan al GPS en HTTP
    'process.env.FORCE_GPS_HTTP': '"true"',
    'process.env.ALLOW_INSECURE_GEOLOCATION': '"true"'
  }
}
