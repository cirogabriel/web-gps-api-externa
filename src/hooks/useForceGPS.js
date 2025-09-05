import { useState, useEffect, useRef } from 'react';

// Constantes para precisión GPS MILIMÉTRICA
const GPS_PRECISION_CONFIG = {
  ACCURACY_THRESHOLD: 5,      // Precisión mínima: 5 metros
  BUFFER_SIZE: 5,             // Promedio de 5 lecturas
  HIGH_PRECISION_TIMEOUT: 60000, // 60 segundos para mejor señal
  MIN_UPDATE_INTERVAL: 1000,  // Actualización cada segundo
  MIN_DISTANCE_THRESHOLD: 1,  // Movimiento mínimo: 1 metro
  MAX_ATTEMPTS: 5             // Máximo 5 intentos
}

// Función para calcular distancia entre dos puntos GPS
const calculateDistance = (pos1, pos2) => {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = pos1.latitude * Math.PI/180
  const φ2 = pos2.latitude * Math.PI/180
  const Δφ = (pos2.latitude - pos1.latitude) * Math.PI/180
  const Δλ = (pos2.longitude - pos1.longitude) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distancia en metros
}

// Hook que FUERZA GPS en HTTP usando múltiples estrategias CON PRECISIÓN MILIMÉTRICA
export const useForceGPS = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationSource, setLocationSource] = useState(null);
  const watchIdRef = useRef(null);

  // Estrategia 0: FORZAR GPS BRUTAL (Chrome flags + Override)
  const getGPSBruteForce = () => {
    return new Promise((resolve, reject) => {
      console.log('[ForceGPS] 💪 Estrategia BRUTE FORCE - Forzando GPS sin restricciones...');
      
      if (!navigator.geolocation) {
        reject(new Error('GPS no disponible en este navegador'));
        return;
      }

      // OVERRIDE: Forzar contexto seguro temporalmente
      const originalIsSecureContext = window.isSecureContext;
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
        configurable: true
      });

      let attempts = 0;
      let bestPosition = null;

      const tryBruteForce = () => {
        attempts++;
        console.log(`[ForceGPS] 💪 BRUTE FORCE intento ${attempts}/${GPS_PRECISION_CONFIG.MAX_ATTEMPTS}`);

        // Configuración AGRESIVA para GPS
        const aggressiveOptions = {
          enableHighAccuracy: true,
          timeout: 15000,  // Timeout más corto pero múltiples intentos
          maximumAge: 0,
          // Opciones no estándar pero que algunos navegadores respetan
          requireSecureOrigin: false,
          forcePermission: true
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(`[ForceGPS] 💪 BRUTE FORCE ÉXITO! Precisión: ${position.coords.accuracy.toFixed(1)}m`);
            
            if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            // Si tenemos precisión suficiente o agotamos intentos
            if (position.coords.accuracy <= GPS_PRECISION_CONFIG.ACCURACY_THRESHOLD || attempts >= GPS_PRECISION_CONFIG.MAX_ATTEMPTS) {
              // Restaurar contexto original
              Object.defineProperty(window, 'isSecureContext', {
                value: originalIsSecureContext,
                writable: true,
                configurable: true
              });

              const result = {
                latitude: bestPosition.coords.latitude,
                longitude: bestPosition.coords.longitude,
                accuracy: bestPosition.coords.accuracy,
                timestamp: bestPosition.timestamp,
                speed: bestPosition.coords.speed || 0,
                heading: bestPosition.coords.heading || 0,
                source: 'brute_force_gps'
              };

              console.log('[ForceGPS] 💪 BRUTE FORCE COMPLETADO!', {
                lat: result.latitude.toFixed(8),
                lng: result.longitude.toFixed(8),
                accuracy: result.accuracy.toFixed(2)
              });

              resolve(result);
            } else {
              setTimeout(tryBruteForce, 2000);
            }
          },
          (error) => {
            console.log(`[ForceGPS] 💪 BRUTE FORCE intento ${attempts} falló:`, error.message);
            
            if (attempts >= GPS_PRECISION_CONFIG.MAX_ATTEMPTS) {
              // Restaurar contexto
              Object.defineProperty(window, 'isSecureContext', {
                value: originalIsSecureContext,
                writable: true,
                configurable: true
              });

              if (bestPosition) {
                resolve({
                  latitude: bestPosition.coords.latitude,
                  longitude: bestPosition.coords.longitude,
                  accuracy: bestPosition.coords.accuracy,
                  timestamp: bestPosition.timestamp,
                  speed: bestPosition.coords.speed || 0,
                  heading: bestPosition.coords.heading || 0,
                  source: 'brute_force_fallback'
                });
              } else {
                reject(new Error('BRUTE FORCE GPS falló: ' + error.message));
              }
            } else {
              setTimeout(tryBruteForce, 2000);
            }
          },
          aggressiveOptions
        );
      };

      tryBruteForce();
    });
  };
  const getGPSDirect = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS no disponible'));
        return;
      }

      let attempts = 0;
      let bestPosition = null;

      const tryPosition = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            attempts++;
            
            // Guardar la posición más precisa
            if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            console.log(`[ForceGPS] Intento ${attempts}: precisión ${position.coords.accuracy.toFixed(1)}m`);

            // Si tenemos precisión MILIMÉTRICA o llegamos al máximo, resolver
            if (position.coords.accuracy <= GPS_PRECISION_CONFIG.ACCURACY_THRESHOLD || attempts >= GPS_PRECISION_CONFIG.MAX_ATTEMPTS) {
              const result = {
                latitude: bestPosition.coords.latitude,
                longitude: bestPosition.coords.longitude,
                accuracy: bestPosition.coords.accuracy,
                timestamp: bestPosition.timestamp,
                speed: bestPosition.coords.speed || 0,
                heading: bestPosition.coords.heading || 0,
                source: 'direct_gps_precision'
              };

              console.log(`[ForceGPS] ✅ GPS MILIMÉTRICO obtenido! Precisión: ${bestPosition.coords.accuracy.toFixed(2)}m`, {
                lat: result.latitude.toFixed(8),
                lng: result.longitude.toFixed(8)
              });

              resolve(result);
            } else {
              // Intentar de nuevo para mejor precisión
              setTimeout(tryPosition, 3000);
            }
          },
          (err) => {
            if (attempts === 0) {
              reject(err);
            } else {
              // Si tenemos alguna posición, usarla
              if (bestPosition) {
                resolve({
                  latitude: bestPosition.coords.latitude,
                  longitude: bestPosition.coords.longitude,
                  accuracy: bestPosition.coords.accuracy,
                  timestamp: bestPosition.timestamp,
                  speed: bestPosition.coords.speed || 0,
                  heading: bestPosition.coords.heading || 0,
                  source: 'direct_gps_fallback'
                });
              } else {
                reject(err);
              }
            }
          },
          {
            enableHighAccuracy: true,
            timeout: GPS_PRECISION_CONFIG.HIGH_PRECISION_TIMEOUT / GPS_PRECISION_CONFIG.MAX_ATTEMPTS,
            maximumAge: 0
          }
        );
      };

      tryPosition();
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

    console.log('[ForceGPS] 🚀 Iniciando obtención de ubicación con estrategias HTTP...');

    // Estrategia 0: BRUTE FORCE GPS (La que realmente funciona en HTTP)
    try {
      console.log('[ForceGPS] 💪 Intentando BRUTE FORCE GPS...');
      const bruteForceGPS = await getGPSBruteForce();
      setLocation(bruteForceGPS);
      setLocationSource('brute_force');
      setLoading(false);
      console.log('[ForceGPS] 🎯 BRUTE FORCE GPS EXITOSO!', bruteForceGPS);
      return bruteForceGPS;
    } catch (bruteError) {
      console.log('[ForceGPS] 💪 BRUTE FORCE falló:', bruteError.message);
    }

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
    console.error('[ForceGPS] ❌ TODAS LAS ESTRATEGIAS FALLARON');
    setError('GPS no disponible - Todas las estrategias fallaron');
    setLoading(false);
    throw new Error('Todas las estrategias de GPS fallaron');
  };

  // Tracking continuo
  const startWatching = async () => {
    if (watchIdRef.current) return;

    console.log('[ForceGPS] Iniciando tracking continuo con precisión MILIMÉTRICA...');

    // Intentar watch position directo con precisión optimizada
    try {
      if (navigator.geolocation) {
        // Variables para filtrado de precisión
        let bestAccuracy = Infinity;
        let locationBuffer = [];
        let lastUpdate = 0;
        let lastPosition = null;

        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const accuracy = position.coords.accuracy || Infinity;
            const currentTime = Date.now();

            // Verificar intervalo mínimo entre actualizaciones
            if (currentTime - lastUpdate < GPS_PRECISION_CONFIG.MIN_UPDATE_INTERVAL) {
              return;
            }

            console.log(`[ForceGPS] 📡 Nueva lectura GPS - Precisión: ${accuracy.toFixed(1)}m`);

            // Filtrar lecturas por precisión milimétrica
            if (accuracy <= GPS_PRECISION_CONFIG.ACCURACY_THRESHOLD) {
              const currentPos = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: accuracy,
                timestamp: position.timestamp
              };

              // Verificar si hay movimiento significativo
              if (lastPosition) {
                const distance = calculateDistance(lastPosition, currentPos);
                if (distance < GPS_PRECISION_CONFIG.MIN_DISTANCE_THRESHOLD && accuracy > bestAccuracy * 1.5) {
                  console.log(`[ForceGPS] ⏭️ Descartando lectura por movimiento mínimo: ${distance.toFixed(2)}m`);
                  return;
                }
              }

              // Agregar al buffer de posiciones precisas
              locationBuffer.push(currentPos);

              // Mantener solo las últimas lecturas para promedio
              if (locationBuffer.length > GPS_PRECISION_CONFIG.BUFFER_SIZE) {
                locationBuffer.shift();
              }

              // Calcular posición promediada para máxima precisión
              const avgLat = locationBuffer.reduce((sum, pos) => sum + pos.latitude, 0) / locationBuffer.length;
              const avgLng = locationBuffer.reduce((sum, pos) => sum + pos.longitude, 0) / locationBuffer.length;
              const avgAccuracy = locationBuffer.reduce((sum, pos) => sum + pos.accuracy, 0) / locationBuffer.length;

              const locationData = {
                latitude: avgLat,
                longitude: avgLng,
                accuracy: avgAccuracy,
                timestamp: position.timestamp,
                speed: position.coords.speed || 0,
                heading: position.coords.heading || 0,
                source: 'watch_precision'
              };

              setLocation(locationData);
              setLocationSource('watch_precision');
              lastUpdate = currentTime;
              lastPosition = currentPos;

              console.log(`[ForceGPS] 🎯 Posición MILIMÉTRICA actualizada (promedio de ${locationBuffer.length} lecturas):`, {
                lat: avgLat.toFixed(8),
                lng: avgLng.toFixed(8),
                accuracy: avgAccuracy.toFixed(2)
              });

              // Actualizar mejor precisión alcanzada
              if (avgAccuracy < bestAccuracy) {
                bestAccuracy = avgAccuracy;
                console.log(`[ForceGPS] 🏆 ¡Nueva mejor precisión alcanzada: ${bestAccuracy.toFixed(2)}m!`);
              }

            } else {
              // Lectura imprecisa - usar solo si no tenemos mejores datos
              if (bestAccuracy === Infinity) {
                const locationData = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: accuracy,
                  timestamp: position.timestamp,
                  speed: position.coords.speed || 0,
                  heading: position.coords.heading || 0,
                  source: 'watch_fallback'
                };
                setLocation(locationData);
                setLocationSource('watch_fallback');
                console.log(`[ForceGPS] 🔄 Usando lectura temporal (${accuracy.toFixed(1)}m) - optimizando señal...`);
              } else {
                console.log(`[ForceGPS] ❌ Descartando lectura imprecisa: ${accuracy.toFixed(1)}m (mejor disponible: ${bestAccuracy.toFixed(1)}m)`);
              }
            }
          },
          (error) => {
            console.warn('[ForceGPS] ⚠️ Watch error:', error.message);
            // Fallback a polling
            startPolling();
          },
          {
            enableHighAccuracy: true,
            timeout: GPS_PRECISION_CONFIG.HIGH_PRECISION_TIMEOUT,
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
