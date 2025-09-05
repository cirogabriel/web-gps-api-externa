import { useState, useEffect, useCallback, useRef } from 'react';
import { FirebaseTrackingService } from '../services/firebaseService';

// Hook para tracking continuo en segundo plano con trayectorias
export const useBackgroundTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackerId, setTrackerId] = useState(null);
  const [serviceWorker, setServiceWorker] = useState(null);
  const [trackingService] = useState(() => new FirebaseTrackingService());
  const trackingInterval = useRef(null);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[Background Tracker] SW registrado:', registration);
          setServiceWorker(registration);
        })
        .catch(error => {
          console.error('[Background Tracker] Error registrando SW:', error);
        });
    }
  }, []);

  // Iniciar tracking en segundo plano
  const startBackgroundTracking = useCallback(async (userName = 'Usuario') => {
    try {
      // Generar ID único
      const userId = trackingService.generateUserId();
      setTrackerId(userId);

      // Inicializar tracker en Firebase
      trackingService.initializeTracker(userName);

      // Iniciar Service Worker si está disponible
      if (serviceWorker && serviceWorker.active) {
        serviceWorker.active.postMessage({
          type: 'START_BACKGROUND_TRACKING',
          data: { userId, userName }
        });
      }

      // Tracking local como respaldo
      startLocalTracking(userId, userName);

      setIsTracking(true);
      console.log('[Background Tracker] Tracking iniciado para:', userName);

    } catch (error) {
      console.error('[Background Tracker] Error iniciando tracking:', error);
      throw error;
    }
  }, [serviceWorker, trackingService, startLocalTracking]);

  // Tracking local como respaldo (cada 10 segundos)
  const startLocalTracking = useCallback((userId, userName) => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }

    trackingInterval.current = setInterval(async () => {
      try {
        const position = await getCurrentPosition();
        if (position) {
          await trackingService.sendLocationWithTrajectory({
            ...position,
            userId,
            userName,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Fallback con IP cuando falla GPS
        console.error('[Background Tracker] Error GPS:', error.message);
        try {
          const ipLocation = await getLocationByIP();
          if (ipLocation) {
            await trackingService.sendLocationWithTrajectory({
              ...ipLocation,
              userId,
              userName,
              timestamp: Date.now()
            });
          }
        } catch (ipError) {
          console.error('[Background Tracker] Error con IP fallback:', ipError);
        }
      }
    }, 10000); // 10 segundos para trayectoria continua

  }, [trackingService]);

  // Detener tracking en segundo plano
  const stopBackgroundTracking = useCallback(() => {
    // Detener Service Worker
    if (serviceWorker && serviceWorker.active) {
      serviceWorker.active.postMessage({
        type: 'STOP_BACKGROUND_TRACKING'
      });
    }

    // Detener tracking local
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }

    // Detener Firebase tracking
    if (trackerId) {
      trackingService.stopTracking();
    }

    setIsTracking(false);
    setTrackerId(null);
    console.log('[Background Tracker] Tracking detenido');

  }, [serviceWorker, trackingService, trackerId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopBackgroundTracking();
    };
  }, [stopBackgroundTracking]);

  return {
    isTracking,
    trackerId,
    startBackgroundTracking,
    stopBackgroundTracking
  };
};

// Hook para visualizar múltiples trayectorias
export const useMultipleTrajectories = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [trajectories, setTrajectories] = useState({});
  const [trackingService] = useState(() => new FirebaseTrackingService());

  // Obtener usuarios activos
  const loadActiveUsers = useCallback(async () => {
    try {
      const users = await trackingService.getActiveUsers();
      setActiveUsers(users);
      
      // Cargar trayectorias de usuarios activos
      if (users.length > 0) {
        const userIds = users.map(user => user.id);
        trackingService.getMultipleTrajectories(userIds, (trajectoryData) => {
          setTrajectories(trajectoryData);
        });
      }
    } catch (error) {
      console.error('[Multiple Trajectories] Error cargando usuarios:', error);
    }
  }, [trackingService]);

  // Obtener trayectoria por rango de fechas
  const getTrajectoryByDateRange = useCallback((userId, startDate, endDate) => {
    return new Promise((resolve) => {
      trackingService.getUserTrajectoryByDateRange(userId, startDate, endDate, resolve);
    });
  }, [trackingService]);

  // Limpiar listeners
  useEffect(() => {
    return () => {
      trackingService.clearTrajectoryListeners();
    };
  }, [trackingService]);

  return {
    activeUsers,
    trajectories,
    loadActiveUsers,
    getTrajectoryByDateRange
  };
};

// Función auxiliar para obtener posición GPS
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || 0,
          altitudeAccuracy: position.coords.altitudeAccuracy || 0,
          heading: position.coords.heading || 0,
          speed: position.coords.speed || 0,
          source: 'gps'
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  });
}

// Función auxiliar para obtener ubicación por IP
async function getLocationByIP() {
  const response = await fetch('https://ipapi.co/json/');
  const data = await response.json();
  
  if (data.latitude && data.longitude) {
    return {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      accuracy: 10000,
      altitude: 0,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
      source: 'ip',
      city: data.city,
      region: data.region,
      country: data.country_name
    };
  }
  throw new Error('No se pudo obtener ubicación por IP');
}
