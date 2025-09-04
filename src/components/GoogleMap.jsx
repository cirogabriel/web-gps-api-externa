import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const MapComponent = ({ 
  location, 
  trajectories = {}, 
  activeUsers = [], 
  mode = 'tracker' 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const trajectoriesRef = useRef({}); // Referencias a las polylines
  const userMarkersRef = useRef({}); // Referencias a marcadores de usuarios

  // Colores para diferentes usuarios (memoizado para evitar recreaciones)
  const userColors = useMemo(() => [
    '#FF5722', '#E91E63', '#9C27B0', '#673AB7', 
    '#3F51B5', '#2196F3', '#00BCD4', '#009688',
    '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'
  ], []);

  // Función optimizada para crear el ícono
  const createIcon = useCallback((color = '#EF4444', scale = 2) => ({
    path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: scale,
    anchor: { x: 12, y: 24 },
  }), []);

  // Inicializar mapa
  useEffect(() => {
    if (!map && mapRef.current && window.google) {
      const defaultCenter = { lat: 40.4168, lng: -3.7038 };
      const center = location ? { lat: location.latitude, lng: location.longitude } : defaultCenter;
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: location ? 16 : 10,
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
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(newMap);
    }
  }, [map, location]);

  // Actualizar marcador de ubicación propia (modo tracker)
  useEffect(() => {
    if (!map || !location || mode !== 'tracker') return;

    const position = { lat: location.latitude, lng: location.longitude };

    // Actualizar o crear marcador principal
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: position,
        map: map,
        title: 'Mi ubicación',
        icon: createIcon('#4285F4', 2.5),
        zIndex: 1000
      });
    }

    // Actualizar círculo de precisión
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setCenter(position);
      accuracyCircleRef.current.setRadius(location.accuracy || 50);
    } else {
      accuracyCircleRef.current = new window.google.maps.Circle({
        center: position,
        radius: location.accuracy || 50,
        map: map,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        zIndex: 1
      });
    }

    // Centrar mapa en mi ubicación
    map.setCenter(position);
  }, [map, location, mode, createIcon]);

  // *** NUEVA FUNCIONALIDAD: Dibujar trayectorias de múltiples usuarios ***
  useEffect(() => {
    if (!map || !window.google || mode !== 'watcher') return;

    console.log('[GoogleMap] Actualizando trayectorias:', Object.keys(trajectories).length, 'usuarios');

    // Limpiar trayectorias anteriores
    Object.values(trajectoriesRef.current).forEach(({ polyline, markers }) => {
      if (polyline) polyline.setMap(null);
      if (markers) {
        markers.forEach(marker => marker.setMap(null));
      }
    });
    trajectoriesRef.current = {};

    // Limpiar marcadores de usuarios
    Object.values(userMarkersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    userMarkersRef.current = {};

    // Dibujar trayectoria para cada usuario
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidTrajectories = false;

    Object.entries(trajectories).forEach(([userId, trajectory], index) => {
      if (!trajectory || trajectory.length === 0) return;

      console.log(`[GoogleMap] Dibujando trayectoria para ${userId}:`, trajectory.length, 'puntos');

      const color = userColors[index % userColors.length];
      const path = trajectory.map(point => ({
        lat: point.latitude,
        lng: point.longitude
      }));

      // Crear polyline (línea de trayectoria)
      const polyline = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
        zIndex: 10
      });

      const markers = [];

      // Marcador de inicio (verde)
      if (path.length > 0) {
        const startMarker = new window.google.maps.Marker({
          position: path[0],
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 6
          },
          title: `Inicio - ${trajectory[0].userName || userId}`,
          zIndex: 100
        });
        markers.push(startMarker);

        // Marcador de posición actual (color del usuario)
        const latestPoint = trajectory[trajectory.length - 1];
        const currentMarker = new window.google.maps.Marker({
          position: path[path.length - 1],
          map: map,
          icon: createIcon(color, 2),
          title: `${latestPoint.userName || userId} - Ahora`,
          zIndex: 200
        });
        markers.push(currentMarker);

        // Info window con detalles en tiempo real
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
              <h4 style="margin: 0 0 10px 0; color: ${color};">
                ${latestPoint.userName || `Usuario ${userId.slice(-4)}`}
              </h4>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>📍 Posición:</strong><br>
                ${latestPoint.latitude.toFixed(6)}, ${latestPoint.longitude.toFixed(6)}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>🎯 Precisión:</strong> ${Math.round(latestPoint.accuracy || 0)}m
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>⚡ Velocidad:</strong> ${Math.round((latestPoint.speed || 0) * 3.6)}km/h
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>🕒 Última actualización:</strong><br>
                ${new Date(latestPoint.timestamp).toLocaleString()}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>📊 Puntos registrados:</strong> ${trajectory.length}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>📡 Fuente:</strong> ${latestPoint.source === 'gps' ? 'GPS' : 'IP'}
              </p>
            </div>
          `
        });

        currentMarker.addListener('click', () => {
          infoWindow.open(map, currentMarker);
        });

        // Almacenar referencias
        trajectoriesRef.current[userId] = {
          polyline,
          markers,
          infoWindow
        };

        // Extender bounds para incluir toda la trayectoria
        path.forEach(point => {
          bounds.extend(point);
        });
        hasValidTrajectories = true;
      }
    });

    // Ajustar vista para mostrar todas las trayectorias
    if (hasValidTrajectories && Object.keys(trajectories).length > 0) {
      map.fitBounds(bounds);
      
      // Ajustar zoom si es necesario
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom > 18) {
          map.setZoom(18);
        }
      });
    }

  }, [map, trajectories, activeUsers, mode, userColors, createIcon]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px'
        }} 
      />
      
      {/* Indicador de modo */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md border">
        <span className="text-sm font-medium text-gray-700">
          {mode === 'tracker' ? '📍 Mi ubicación' : '👁️ Observando trayectorias'}
        </span>
      </div>

      {/* Contador de usuarios activos */}
      {mode === 'watcher' && (
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md border">
          <span className="text-sm font-medium text-gray-700">
            {Object.keys(trajectories).length} usuario{Object.keys(trajectories).length !== 1 ? 's' : ''} activo{Object.keys(trajectories).length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Estado de carga */}
      {mode === 'watcher' && Object.keys(trajectories).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
          <div className="bg-white px-4 py-3 rounded-lg shadow-md border">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Buscando usuarios activos...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GoogleMap = ({ location, isTracking, trajectories, activeUsers, mode }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <p className="text-gray-600">Error: Google Maps API key no configurada</p>
      </div>
    );
  }

  return (
    <Wrapper apiKey={apiKey}>
      <MapComponent 
        location={location} 
        trajectories={trajectories}
        activeUsers={activeUsers}
        mode={mode}
      />
    </Wrapper>
  );
};

export default GoogleMap;
