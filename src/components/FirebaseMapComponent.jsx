import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const FirebaseMapComponent = ({ 
  location, 
  watchedUsers = {}, 
  trajectories = {}
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const currentLocationMarkerRef = useRef(null);
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

  // Colores para diferentes usuarios
  const getUserColor = useCallback((userId) => {
    const colors = [
      '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', 
      '#F59E0B', '#EF4444', '#6366F1', '#EC4899',
      '#84CC16', '#06B6D4', '#F97316', '#14B8A6'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Función para actualizar trayectorias
  const updateTrajectory = useCallback((userId, trajectory, color) => {
    if (!map || !trajectory || trajectory.length === 0) return;

    // Limpiar polyline existente
    if (polylineRefs.current[userId]) {
      polylineRefs.current[userId].setMap(null);
    }

    // Crear nueva polyline
    const path = trajectory.map(point => ({
      lat: point.latitude,
      lng: point.longitude
    }));

    const polyline = new window.google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 3,
      zIndex: 100
    });

    polyline.setMap(map);
    polylineRefs.current[userId] = polyline;

    console.log(`[Firebase Map] Trayectoria actualizada para ${userId}: ${trajectory.length} puntos`);
  }, [map]);

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

  // Actualizar marcador de ubicación actual (si existe)
  useEffect(() => {
    if (!map || !location) return;

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    currentLocationMarkerRef.current = new window.google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: map,
      title: 'Mi ubicación',
      icon: createUserIcon('#4F46E5', true),
      zIndex: 1000
    });

    // Centrar mapa en la ubicación actual
    map.setCenter({ lat: location.latitude, lng: location.longitude });
  }, [map, location, createUserIcon]);

  // Actualizar marcadores de usuarios observados
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores existentes que ya no están siendo observados
    Object.keys(userMarkersRef.current).forEach(userId => {
      if (!watchedUsers[userId]) {
        if (userMarkersRef.current[userId]) {
          userMarkersRef.current[userId].setMap(null);
          delete userMarkersRef.current[userId];
        }
      }
    });

    // Crear o actualizar marcadores para usuarios observados
    Object.entries(watchedUsers).forEach(([userId, userData]) => {
      const position = userData.position || userData;
      if (!position || !position.latitude || !position.longitude) return;

      const userColor = getUserColor(userId);
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
  }, [map, watchedUsers, trajectories, getUserColor, createUserIcon, updateTrajectory]);

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
      libraries={['places']}
    />
  );
};

export default FirebaseMapComponent;
