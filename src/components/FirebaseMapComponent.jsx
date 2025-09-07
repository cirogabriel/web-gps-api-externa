import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { getUserColor } from '../utils/userColors';

const FirebaseMapComponent = ({ 
  location, 
  watchedUsers = {}, 
  trajectories = {}
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const userMarkersRef = useRef({});
  const polylineRefs = useRef({});

  // Crear ícono personalizado para usuarios
  const createUserIcon = useCallback((color = '#EF4444', isActive = true) => ({
    path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
    fillColor: color,
    fillOpacity: isActive ? 1 : 0.5,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.5,
    anchor: { x: 12, y: 24 },
  }), []);

  // Función para obtener color de usuario
  const getColorForUser = useCallback((userId) => {
    const color = getUserColor(userId);
    console.log(`[Firebase Map] Color asignado a ${userId}: ${color}`);
    return color;
  }, []);

  // Función para actualizar trayectorias
  const updateTrajectory = useCallback((userId, trajectory, color) => {
    if (!map || !trajectory || trajectory.length === 0) return;

    console.log(`[Firebase Map] 📍 Procesando histórico para ${userId}:`, trajectory);

    // Limpiar elementos anteriores de este usuario
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

    if (trajectory.length === 1) {
      // Solo un punto - mostrar un marcador clásico
      const point = trajectory[0];
      console.log(`[Firebase Map] 📍 Mostrando punto único en:`, point);
      
      const marker = new window.google.maps.Marker({
        position: { lat: point.latitude, lng: point.longitude },
        map: map,
        title: `${userId} - Ubicación histórica`,
        icon: createUserIcon(color, true),
        zIndex: 1000
      });
      
      userMarkersRef.current[`${userId}_point`] = marker;
      
      // Centrar en el punto único
      map.setCenter({ lat: point.latitude, lng: point.longitude });
      map.setZoom(18);
      
    } else {
      // Múltiples puntos - dibujar trayectoria
      const path = trajectory.map(point => ({
        lat: point.latitude,
        lng: point.longitude
      }));

      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 4,
        zIndex: 100
      });

      polyline.setMap(map);
      polylineRefs.current[userId] = polyline;

      // Marcador de inicio (verde) - pin clásico
      const startMarker = new window.google.maps.Marker({
        position: { lat: trajectory[0].latitude, lng: trajectory[0].longitude },
        map: map,
        title: `${userId} - Inicio del recorrido`,
        icon: createUserIcon('#10B981', true),
        zIndex: 1000
      });
      userMarkersRef.current[`${userId}_start`] = startMarker;

      // Marcador de fin (rojo) - pin clásico
      const lastPoint = trajectory[trajectory.length - 1];
      const endMarker = new window.google.maps.Marker({
        position: { lat: lastPoint.latitude, lng: lastPoint.longitude },
        map: map,
        title: `${userId} - Fin del recorrido`,
        icon: createUserIcon('#EF4444', true),
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

  // Actualizar marcadores de usuarios observados
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores existentes que ya no están siendo observados
    Object.keys(userMarkersRef.current).forEach(key => {
      // Obtener el userId base (sin sufijos como _start, _end, _point)
      const baseUserId = key.split('_')[0];
      
      if (!watchedUsers[baseUserId] && !watchedUsers[key]) {
        if (userMarkersRef.current[key]) {
          userMarkersRef.current[key].setMap(null);
          delete userMarkersRef.current[key];
        }
      }
    });

    // Crear o actualizar marcadores para usuarios observados
    Object.entries(watchedUsers).forEach(([userId, userData]) => {
      const position = userData.position || userData;
      if (!position || !position.latitude || !position.longitude) return;

      const userColor = getColorForUser(userId);
      const isActive = userData.timestamp ? 
        (Date.now() - userData.timestamp) < (5 * 60 * 1000) : true;

      if (userMarkersRef.current[userId]) {
        // Actualizar posición del marcador existente
        userMarkersRef.current[userId].setPosition({
          lat: position.latitude,
          lng: position.longitude
        });
        userMarkersRef.current[userId].setIcon(createUserIcon(userColor, isActive));
      } else {
        // Crear nuevo marcador
        const marker = new window.google.maps.Marker({
          position: { lat: position.latitude, lng: position.longitude },
          map: map,
          title: `Usuario: ${userId}`,
          icon: createUserIcon(userColor, isActive),
          zIndex: 500
        });

        // Crear InfoWindow para mostrar información del usuario
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                ${userId}
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

      // Actualizar trayectoria si existe
      if (trajectories[userId]) {
        updateTrajectory(userId, trajectories[userId], userColor);
      }
    });
  }, [map, watchedUsers, trajectories, getColorForUser, createUserIcon, updateTrajectory]);

  // Efecto específico para manejar cambios en trayectorias
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

    // Procesar cada trayectoria
    Object.entries(trajectories).forEach(([userId, trajectory]) => {
      if (trajectory && trajectory.length > 0) {
        const userColor = getColorForUser(userId);
        console.log(`[Firebase Map] 🗺️ Dibujando trayectoria para ${userId} con ${trajectory.length} puntos`);
        updateTrajectory(userId, trajectory, userColor);
      }
    });
  }, [map, trajectories, getColorForUser, updateTrajectory]);

  const render = (status) => {
    if (status === 'LOADING') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium mb-2">Error cargando Google Maps</p>
            <p className="text-sm text-red-500">Verifica tu conexión a internet y la API key</p>
          </div>
        </div>
      );
    }

    return <div ref={mapRef} className="w-full h-full" />;
  };

  return (
    <Wrapper 
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBhPp4KjSRJXvjNH6mhFXq0V6e8mDXeQNE"} 
      render={render}
      libraries={['places', 'marker']}
    />
  );
};

export default FirebaseMapComponent;
