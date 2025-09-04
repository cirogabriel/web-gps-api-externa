import React, { useEffect, useRef, useState } from 'react';

// Componente de mapa con trayectorias continuas para múltiples usuarios
const TrajectoryMap = ({ 
  currentLocation, 
  trajectories = {}, 
  activeUsers = [], 
  mode = 'tracker',
  mapHeight = '400px' 
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    if (!window.google || !mapRef.current || mapLoaded) return;

    const initMap = () => {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: currentLocation || { lat: -12.0464, lng: -77.0428 }, // Lima por defecto
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      setMapLoaded(true);
      console.log('[TrajectoryMap] Mapa inicializado');
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Cargar Google Maps API si no está disponible
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [mapLoaded, currentLocation]);

  // Actualizar ubicación actual (modo tracker)
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded || !currentLocation) return;

    const { latitude: lat, longitude: lng } = currentLocation;
    const position = { lat, lng };

    // Centrar mapa en ubicación actual
    googleMapRef.current.setCenter(position);

    // Crear o actualizar marcador de ubicación actual
    if (!markersRef.current.currentUser) {
      markersRef.current.currentUser = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: 'Mi ubicación',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
    } else {
      markersRef.current.currentUser.setPosition(position);
    }

  }, [currentLocation, mapLoaded]);

  // Mostrar trayectorias de múltiples usuarios
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded || mode !== 'watcher') return;

    // Limpiar marcadores y líneas anteriores de usuarios remotos
    Object.keys(markersRef.current).forEach(key => {
      if (key !== 'currentUser') {
        markersRef.current[key].setMap(null);
        delete markersRef.current[key];
      }
    });

    Object.keys(polylineRef.current).forEach(key => {
      polylineRef.current[key].setMap(null);
      delete polylineRef.current[key];
    });

    // Colores para diferentes usuarios
    const userColors = [
      '#FF5722', '#E91E63', '#9C27B0', '#673AB7', 
      '#3F51B5', '#2196F3', '#00BCD4', '#009688',
      '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'
    ];

    activeUsers.forEach((user, index) => {
      const userId = user.id;
      const trajectory = trajectories[userId] || [];
      const color = userColors[index % userColors.length];

      if (trajectory.length === 0) return;

      // Última posición del usuario
      const lastPosition = trajectory[trajectory.length - 1];
      const userLocation = {
        lat: lastPosition.latitude,
        lng: lastPosition.longitude
      };

      // Crear marcador para el usuario
      markersRef.current[userId] = new window.google.maps.Marker({
        position: userLocation,
        map: googleMapRef.current,
        title: user.name || `Usuario ${userId.slice(-4)}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Crear línea de trayectoria
      if (trajectory.length > 1) {
        const path = trajectory.map(point => ({
          lat: point.latitude,
          lng: point.longitude
        }));

        polylineRef.current[userId] = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: googleMapRef.current
        });
      }

      // Info window para mostrar detalles
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: ${color};">
              ${user.name || `Usuario ${userId.slice(-4)}`}
            </h3>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Última actualización:</strong><br>
              ${new Date(lastPosition.timestamp).toLocaleString()}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Precisión:</strong> ${Math.round(lastPosition.accuracy)}m
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Puntos de trayectoria:</strong> ${trajectory.length}
            </p>
            ${lastPosition.speed ? `
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Velocidad:</strong> ${Math.round(lastPosition.speed * 3.6)} km/h
              </p>
            ` : ''}
          </div>
        `
      });

      markersRef.current[userId].addListener('click', () => {
        infoWindow.open(googleMapRef.current, markersRef.current[userId]);
      });
    });

    // Ajustar vista para mostrar todos los usuarios
    if (activeUsers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      activeUsers.forEach(user => {
        const trajectory = trajectories[user.id] || [];
        if (trajectory.length > 0) {
          const lastPosition = trajectory[trajectory.length - 1];
          bounds.extend({
            lat: lastPosition.latitude,
            lng: lastPosition.longitude
          });
        }
      });
      googleMapRef.current.fitBounds(bounds);
    }

  }, [activeUsers, trajectories, mapLoaded, mode]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: mapHeight,
          borderRadius: '8px'
        }}
        className="border border-gray-200"
      />
      
      {/* Indicador de modo */}
      <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-full shadow-md">
        <span className="text-sm font-medium text-gray-700">
          {mode === 'tracker' ? '📍 Mi ubicación' : '👥 Múltiples usuarios'}
        </span>
      </div>

      {/* Estado de trayectorias */}
      {mode === 'watcher' && (
        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-md">
          <span className="text-sm text-gray-600">
            {activeUsers.length} usuario{activeUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrajectoryMap;