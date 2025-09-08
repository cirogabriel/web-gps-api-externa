import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { getUserColor } from '../utils/userColors';

const FirebaseMapComponent = ({ location, watchedUsers, trajectories }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const userMarkersRef = useRef({});
  const polylineRefs = useRef({});
  
  // Referencias para tracking en tiempo real
  const liveListenersRef = useRef({});  // Referencias a listeners activos
  const livePolylinesRef = useRef({}); // Polylines de tracking en vivo
  const lastPositionsRef = useRef({}); // Últimas posiciones guardadas

  // Función para obtener color único del usuario
  const getColorForUser = useCallback((userId) => {
    return getUserColor(userId);
  }, []);

  // Función para crear íconos de usuario personalizados
  const createUserIcon = useCallback((color, isLarge = false) => {
    const size = isLarge ? 24 : 16;
    const strokeWidth = isLarge ? 3 : 2;
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1.0,
      scale: size / 2,
      strokeColor: '#FFFFFF',
      strokeWeight: strokeWidth,
      anchor: new window.google.maps.Point(0, 0)
    };
  }, []);

  // Función para iniciar tracking en tiempo real
  const startLiveTracking = useCallback((userId, initialPosition) => {
    if (liveListenersRef.current[userId]) {
      console.log(`[Firebase Map] ⚠️ Ya existe listener para ${userId}`);
      return;
    }

    console.log(`[Firebase Map] 🎯 Iniciando listener en tiempo real para ${userId}`);
    
    const userPositionRef = ref(database, `users/${userId}/currentPosition`);
    const userColor = getColorForUser(userId);
    
    // Crear polyline inicial vacía
    const polyline = new window.google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: userColor,
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map
    });
    livePolylinesRef.current[userId] = polyline;
    
    // Crear/actualizar marcador inicial
    const initialLatLng = { 
      lat: initialPosition.latitude, 
      lng: initialPosition.longitude 
    };
    
    if (userMarkersRef.current[userId]) {
      userMarkersRef.current[userId].setPosition(initialLatLng);
    } else {
      const marker = new window.google.maps.Marker({
        position: initialLatLng,
        map: map,
        title: `${userId} - Tracking en Vivo`,
        icon: createUserIcon(userColor, true),
        zIndex: 1000
      });
      userMarkersRef.current[userId] = marker;
    }
    
    // Agregar punto inicial a la polyline
    const path = polyline.getPath();
    path.push(new window.google.maps.LatLng(initialLatLng.lat, initialLatLng.lng));
    lastPositionsRef.current[userId] = initialLatLng;
    
    // Configurar listener en tiempo real
    const unsubscribe = onValue(userPositionRef, (snapshot) => {
      const position = snapshot.val();
      
      if (!position || !position.latitude || !position.longitude) {
        console.log(`[Firebase Map] ⚠️ Posición inválida para ${userId}:`, position);
        return;
      }
      
      const newLatLng = { lat: position.latitude, lng: position.longitude };
      const lastPosition = lastPositionsRef.current[userId];
      
      console.log(`[Firebase Map] 📍 Nueva posición en tiempo real para ${userId}:`, newLatLng);
      
      // Actualizar marcador
      if (userMarkersRef.current[userId]) {
        userMarkersRef.current[userId].setPosition(newLatLng);
        
        // Actualizar InfoWindow
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                ${userId} (En Vivo) 🔴
              </h3>
              <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">
                <div><strong>Lat:</strong> ${position.latitude.toFixed(6)}</div>
                <div><strong>Lng:</strong> ${position.longitude.toFixed(6)}</div>
                ${position.accuracy ? `<div><strong>Precisión:</strong> ${Math.round(position.accuracy)}m</div>` : ''}
                <div><strong>Actualizado:</strong> ${new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          `
        });
        
        userMarkersRef.current[userId].addListener('click', () => {
          infoWindow.open(map, userMarkersRef.current[userId]);
        });
      }
      
      // Extender polyline solo si la posición es significativamente diferente
      if (lastPosition && 
          (Math.abs(lastPosition.lat - newLatLng.lat) > 0.000005 || 
           Math.abs(lastPosition.lng - newLatLng.lng) > 0.000005)) {
        
        const polyline = livePolylinesRef.current[userId];
        if (polyline) {
          const path = polyline.getPath();
          path.push(new window.google.maps.LatLng(newLatLng.lat, newLatLng.lng));
          
          console.log(`[Firebase Map] ➡️ Polyline extendida para ${userId}:`, {
            desde: lastPosition,
            hasta: newLatLng,
            totalPuntos: path.getLength()
          });
        }
      }
      
      // Mover cámara automáticamente
      map.panTo(newLatLng);
      
      // Guardar nueva posición
      lastPositionsRef.current[userId] = newLatLng;
    });
    
    // Guardar referencia al listener
    liveListenersRef.current[userId] = unsubscribe;
    console.log(`[Firebase Map] ✅ Listener en tiempo real configurado para ${userId}`);
  }, [map, getColorForUser, createUserIcon]);

  // Función para detener tracking en tiempo real
  const stopLiveTracking = useCallback((userId) => {
    if (liveListenersRef.current[userId]) {
      console.log(`[Firebase Map] 🛑 Deteniendo listener en tiempo real para ${userId}`);
      liveListenersRef.current[userId](); // Ejecutar unsubscribe
      delete liveListenersRef.current[userId];
    }
    
    // Limpiar polyline de tracking
    if (livePolylinesRef.current[userId]) {
      livePolylinesRef.current[userId].setMap(null);
      delete livePolylinesRef.current[userId];
    }
    
    // Limpiar última posición
    if (lastPositionsRef.current[userId]) {
      delete lastPositionsRef.current[userId];
    }
  }, []);

  // Función para actualizar trayectoria histórica
  const updateTrajectory = useCallback((userId, trajectory, color) => {
    // Limpiar marcadores y polylines anteriores para este usuario
    if (polylineRefs.current[userId]) {
      polylineRefs.current[userId].setMap(null);
      delete polylineRefs.current[userId];
    }
    if (userMarkersRef.current[`${userId}_start`]) {
      userMarkersRef.current[`${userId}_start`].setMap(null);
      delete userMarkersRef.current[`${userId}_start`];
    }
    if (userMarkersRef.current[`${userId}_end`]) {
      userMarkersRef.current[`${userId}_end`].setMap(null);
      delete userMarkersRef.current[`${userId}_end`];
    }

    if (trajectory.length > 0) {
      // Crear polyline para toda la trayectoria
      const path = trajectory.map(point => ({
        lat: point.latitude,
        lng: point.longitude
      }));

      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
      });
      polylineRefs.current[userId] = polyline;

      // Solo marcador de posición final (actual)
      const lastPoint = trajectory[trajectory.length - 1];
      const endMarker = new window.google.maps.Marker({
        position: { lat: lastPoint.latitude, lng: lastPoint.longitude },
        map: map,
        title: `${userId} - Posición actual`,
        icon: createUserIcon(color, true),
        zIndex: 1000
      });
      userMarkersRef.current[`${userId}_end`] = endMarker;

      // Centrar el mapa en toda la trayectoria
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
    }

    console.log(`[Firebase Map] ✅ Histórico procesado para ${userId}: ${trajectory.length} punto(s)`);
  }, [map, createUserIcon]);

  // Inicializar mapa
  useEffect(() => {
    if (!map && mapRef.current && window.google) {
      const defaultCenter = { lat: -13.5409742, lng: -71.9842674 }; // Cusco, Perú
      const center = location ? 
        { lat: location.latitude, lng: location.longitude } : 
        defaultCenter;
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: location ? 16 : 12,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setMap(newMap);
      console.log('[Firebase Map] Mapa inicializado');
    }
  }, [location, map]);

  // Efecto principal para manejar usuarios observados (tracking en vivo y tiempo real)
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores y polylines de usuarios que ya no están siendo observados
    Object.keys(userMarkersRef.current).forEach(key => {
      // Obtener el userId base (sin sufijos como _start, _end, _point)
      const baseUserId = key.split('_')[0];
      
      if (!watchedUsers[baseUserId] && !watchedUsers[key]) {
        console.log(`[Firebase Map] 🗑️ Limpiando usuario no observado: ${key}`);
        
        // Detener tracking en tiempo real si existe
        stopLiveTracking(baseUserId);
        
        // Limpiar marcador
        if (userMarkersRef.current[key]) {
          userMarkersRef.current[key].setMap(null);
          delete userMarkersRef.current[key];
        }
        
        // Limpiar polyline de tracking en vivo
        if (livePolylinesRef.current[baseUserId]) {
          livePolylinesRef.current[baseUserId].setMap(null);
          delete livePolylinesRef.current[baseUserId];
          console.log(`[Firebase Map] 🗑️ Polyline de tracking eliminada para ${baseUserId}`);
        }
        
        // Limpiar última posición guardada
        if (lastPositionsRef.current[baseUserId]) {
          delete lastPositionsRef.current[baseUserId];
        }
      }
    });

    // Iniciar tracking en tiempo real para usuarios en modo 'live'
    Object.entries(watchedUsers).forEach(([userId, userData]) => {
      const position = userData.position || userData;
      const mode = userData.mode || 'static';
      
      if (!position || !position.latitude || !position.longitude) return;

      console.log(`[Firebase Map] 📍 Procesando usuario ${userId} en modo: ${mode}`);

      if (mode === 'live') {
        // Iniciar tracking en tiempo real si no existe
        if (!liveListenersRef.current[userId]) {
          console.log(`[Firebase Map] 🎯 Iniciando tracking en tiempo real para ${userId}`);
          startLiveTracking(userId, position);
        }
      } else {
        // Modo estático - solo actualizar marcador una vez
        const userColor = getColorForUser(userId);
        const newLatLng = { lat: position.latitude, lng: position.longitude };

        if (userMarkersRef.current[userId]) {
          // Actualizar posición del marcador existente
          userMarkersRef.current[userId].setPosition(newLatLng);
          userMarkersRef.current[userId].setIcon(createUserIcon(userColor, true));
        } else {
          // Crear nuevo marcador estático
          const marker = new window.google.maps.Marker({
            position: newLatLng,
            map: map,
            title: `${userId} - Posición estática`,
            icon: createUserIcon(userColor, true),
            zIndex: 1000
          });

          // InfoWindow para posición estática
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                  ${userId} (Estático)
                </h3>
                <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">
                  <div><strong>Lat:</strong> ${position.latitude.toFixed(6)}</div>
                  <div><strong>Lng:</strong> ${position.longitude.toFixed(6)}</div>
                  ${position.accuracy ? `<div><strong>Precisión:</strong> ${Math.round(position.accuracy)}m</div>` : ''}
                  ${position.timestamp ? `<div><strong>Actualizado:</strong> ${new Date(position.timestamp).toLocaleTimeString()}</div>` : ''}
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            // Cerrar otros InfoWindows
            Object.values(userMarkersRef.current).forEach(otherMarker => {
              if (otherMarker.infoWindow) {
                otherMarker.infoWindow.close();
              }
            });
            
            infoWindow.open(map, marker);
          });

          marker.infoWindow = infoWindow;
          userMarkersRef.current[userId] = marker;
        }
      }
    });
  }, [map, watchedUsers, getColorForUser, createUserIcon, startLiveTracking, stopLiveTracking]);

  // Efecto específico para manejar cambios en trayectorias (histórico)
  useEffect(() => {
    if (!map || Object.keys(trajectories).length === 0) return;

    console.log('[Firebase Map] 📈 Procesando trayectorias:', trajectories);

    // Limpiar marcadores de usuarios observados cuando se muestra trayectoria
    Object.keys(userMarkersRef.current).forEach(key => {
      if (!key.includes('_start') && !key.includes('_end') && !key.includes('_point')) {
        if (userMarkersRef.current[key]) {
          userMarkersRef.current[key].setMap(null);
          delete userMarkersRef.current[key];
        }
      }
    });

    // Limpiar polylines de tracking en vivo cuando se muestra histórico
    Object.keys(livePolylinesRef.current).forEach(userId => {
      if (livePolylinesRef.current[userId]) {
        livePolylinesRef.current[userId].setMap(null);
        delete livePolylinesRef.current[userId];
      }
    });

    // Procesar cada trayectoria
    Object.entries(trajectories).forEach(([userId, trajectory]) => {
      const userColor = getColorForUser(userId);
      updateTrajectory(userId, trajectory, userColor);
    });
  }, [map, trajectories, getColorForUser, updateTrajectory]);

  // Limpiar listeners al desmontar el componente
  useEffect(() => {
    const currentListeners = liveListenersRef.current;
    
    return () => {
      Object.keys(currentListeners).forEach(userId => {
        stopLiveTracking(userId);
      });
    };
  }, [stopLiveTracking]);

  const render = (status) => {
    if (status === 'LOADING') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error al cargar Google Maps</p>
            <p className="text-red-500 text-sm mt-1">Verifica tu conexión a internet y la API key</p>
          </div>
        </div>
      );
    }

    return <div ref={mapRef} className="w-full h-full" />;
  };

  return (
    <Wrapper
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      render={render}
      libraries={['places']}
    />
  );
};

export default FirebaseMapComponent;
