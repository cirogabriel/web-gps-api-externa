// Service Worker para GPS en HTTP
const CACHE_NAME = 'gps-tracker-v1';

// Instalar Service Worker
self.addEventListener('install', () => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Interceptar requests para permitir GPS
self.addEventListener('fetch', (event) => {
  // Permitir todas las requests normalmente
  event.respondWith(fetch(event.request));
});

// Manejar mensajes para GPS
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REQUEST_GPS') {
    // El Service Worker puede acceder a GPS incluso en HTTP
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          event.ports[0].postMessage({
            success: true,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: 'service_worker_gps'
            }
          });
        },
        (error) => {
          event.ports[0].postMessage({
            success: false,
            error: error.message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    }
  }
});