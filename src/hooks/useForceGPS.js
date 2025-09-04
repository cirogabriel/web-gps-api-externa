import { useState, useEffect, useRef } from 'react';

// Hook que FUERZA GPS en HTTP usando múltiples estrategias
export const useForceGPS = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationSource, setLocationSource] = useState(null);
  const watchIdRef = useRef(null);

  // Estrategia 1: GPS directo (funciona en algunos navegadores HTTP)
  const getGPSDirect = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS no disponible'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            source: 'direct_gps'
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  };

  // Estrategia 2: GPS via Service Worker
  const getGPSViaServiceWorker = () => {
    return new Promise((resolve, reject) => {
      if (!('serviceWorker' in navigator)) {
        reject(new Error('Service Worker no disponible'));
        return;
      }

      navigator.serviceWorker.ready.then((registration) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(event.data.location);
          } else {
            reject(new Error(event.data.error));
          }
        };

        registration.active.postMessage(
          { type: 'REQUEST_GPS' },
          [messageChannel.port2]
        );
      }).catch(reject);
    });
  };

  // Estrategia 3: Forzar contexto seguro con iframe
  const getGPSViaSecureFrame = () => {
    return new Promise((resolve, reject) => {
      // Crear iframe temporal con data: URL (contexto seguro)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'data:text/html,<script>if(navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>parent.postMessage({type:"gps",data:p},"*"),e=>parent.postMessage({type:"error",error:e.message},"*"),{enableHighAccuracy:true,timeout:30000,maximumAge:0})}</script>';
      
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'gps') {
          const pos = event.data.data;
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
            source: 'secure_frame_gps'
          });
          document.body.removeChild(iframe);
          window.removeEventListener('message', messageHandler);
        } else if (event.data && event.data.type === 'error') {
          reject(new Error(event.data.error));
          document.body.removeChild(iframe);
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);
      document.body.appendChild(iframe);

      // Timeout después de 35 segundos
      setTimeout(() => {
        reject(new Error('Timeout en iframe'));
        try {
          document.body.removeChild(iframe);
          window.removeEventListener('message', messageHandler);
        } catch {
          // Ignorar errores al limpiar
        }
      }, 35000);
    });
  };

  // Función principal que intenta todas las estrategias
  const getCurrentPosition = async () => {
    setLoading(true);
    setError(null);

    console.log('[ForceGPS] Iniciando obtención de ubicación...');

    // Estrategia 1: GPS Directo
    try {
      console.log('[ForceGPS] Intentando GPS directo...');
      const directGPS = await getGPSDirect();
      setLocation(directGPS);
      setLocationSource('direct');
      setLoading(false);
      console.log('[ForceGPS] ✅ GPS directo exitoso:', directGPS);
      return directGPS;
    } catch (directError) {
      console.log('[ForceGPS] ❌ GPS directo falló:', directError.message);
    }

    // Estrategia 2: Service Worker
    try {
      console.log('[ForceGPS] Intentando GPS via Service Worker...');
      const swGPS = await getGPSViaServiceWorker();
      setLocation(swGPS);
      setLocationSource('service_worker');
      setLoading(false);
      console.log('[ForceGPS] ✅ Service Worker GPS exitoso:', swGPS);
      return swGPS;
    } catch (swError) {
      console.log('[ForceGPS] ❌ Service Worker falló:', swError.message);
    }

    // Estrategia 3: Iframe seguro
    try {
      console.log('[ForceGPS] Intentando GPS via iframe seguro...');
      const frameGPS = await getGPSViaSecureFrame();
      setLocation(frameGPS);
      setLocationSource('secure_frame');
      setLoading(false);
      console.log('[ForceGPS] ✅ Iframe seguro exitoso:', frameGPS);
      return frameGPS;
    } catch (frameError) {
      console.log('[ForceGPS] ❌ Iframe seguro falló:', frameError.message);
    }

    // Si todas fallan
    setError('No se pudo obtener GPS por ningún método');
    setLoading(false);
    throw new Error('Todas las estrategias de GPS fallaron');
  };

  // Tracking continuo
  const startWatching = async () => {
    if (watchIdRef.current) return;

    console.log('[ForceGPS] Iniciando tracking continuo...');

    // Intentar watch position directo primero
    try {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0,
              source: 'watch_direct'
            };
            setLocation(locationData);
            setLocationSource('watch_direct');
            console.log('[ForceGPS] 📍 Posición actualizada:', locationData);
          },
          (error) => {
            console.warn('[ForceGPS] ⚠️ Watch error:', error.message);
            // Fallback a polling
            startPolling();
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
        return;
      }
    } catch {
      console.warn('[ForceGPS] Watch no disponible, usando polling');
    }

    // Fallback: polling cada 10 segundos
    startPolling();
  };

  const startPolling = () => {
    const poll = async () => {
      try {
        await getCurrentPosition();
      } catch (error) {
        console.error('[ForceGPS] Error en polling:', error);
      }
    };

    poll(); // Primera ejecución
    watchIdRef.current = setInterval(poll, 10000); // Cada 10 segundos
  };

  const stopWatching = () => {
    if (watchIdRef.current) {
      if (typeof watchIdRef.current === 'number' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } else {
        clearInterval(watchIdRef.current);
      }
      watchIdRef.current = null;
      console.log('[ForceGPS] Tracking detenido');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => stopWatching();
  }, []);

  return {
    location,
    error,
    loading,
    locationSource,
    getCurrentPosition,
    startWatching,
    stopWatching
  };
};
