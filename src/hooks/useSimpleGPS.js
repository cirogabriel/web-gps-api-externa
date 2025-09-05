import { useState, useEffect, useRef } from 'react';

// Hook GPS simple sin dependencias externas - FUNCIONA EN HTTP
export const useSimpleGPS = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  // Función para obtener ubicación actual
  const getCurrentPosition = async () => {
    setLoading(true);
    setError(null);

    try {
      // Estrategia 1: GPS directo
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalización no disponible'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      });

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: Date.now(),
        source: 'gps'
      };

      setLocation(locationData);
      return locationData;

    } catch (gpsError) {
      console.warn('[GPS] Error GPS:', gpsError.message);
      
      try {
        // Estrategia 2: Ubicación por IP como fallback
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          const locationData = {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            accuracy: 10000,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0,
            timestamp: Date.now(),
            source: 'ip',
            city: data.city,
            region: data.region,
            country: data.country_name
          };

          setLocation(locationData);
          return locationData;
        }
      } catch (ipError) {
        console.warn('[GPS] Error IP:', ipError.message);
      }

      // Estrategia 3: Coordenadas por defecto (desarrollo)
      const defaultLocation = {
        latitude: -34.6118,
        longitude: -58.3960,
        accuracy: 100,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
        timestamp: Date.now(),
        source: 'default'
      };

      console.log('[GPS] Usando ubicación por defecto (Buenos Aires)');
      setLocation(defaultLocation);
      setError('GPS no disponible, usando ubicación aproximada');
      return defaultLocation;

    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar seguimiento continuo
  const startWatching = () => {
    if (watchIdRef.current) return;

    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }

    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: Date.now(),
          source: 'gps'
        };

        setLocation(locationData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('[GPS] Error en watch:', error);
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  };

  // Función para detener seguimiento
  const stopWatching = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLoading(false);
    }
  };

  // Limpiar al desmontar componente
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentPosition,
    startWatching,
    stopWatching
  };
};
