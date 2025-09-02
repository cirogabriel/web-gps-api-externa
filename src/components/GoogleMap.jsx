import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const MapComponent = ({ location, isTracking }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Función optimizada para crear el ícono
  const createIcon = useCallback(() => ({
    path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
    fillColor: '#EF4444', // Rojo vibrante para mejor visibilidad
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 2,
    anchor: { x: 12, y: 24 },
  }), []);

  // Inicializar mapa
  useEffect(() => {
    if (!map && mapRef.current && window.google) {
      // Centro por defecto (Madrid, España) si no hay ubicación
      const defaultCenter = { lat: 40.4168, lng: -3.7038 };
      const center = location ? { lat: location.latitude, lng: location.longitude } : defaultCenter;
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: location ? 16 : 10, // Zoom más cercano para mejor detalle
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
          },
          {
            featureType: "administrative",
            elementType: "geometry.fill",
            stylers: [{ color: "#fefefe" }, { lightness: 20 }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }, { lightness: 17 }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }]
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 18 }]
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 16 }]
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 21 }]
          },
          // Ocultar algunos iconos de POI para reducir confusión
          {
            featureType: "poi.business",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(newMap);
    }
  }, [map, location]);

  useEffect(() => {
    if (map && location) {
      const newCenter = { lat: location.latitude, lng: location.longitude };
      
      // Solo actualizar centro del mapa suavemente
      map.panTo(newCenter);

      // Si no existe marcador, crearlo una sola vez
      if (!markerRef.current) {
        markerRef.current = new window.google.maps.Marker({
          position: newCenter,
          map: map,
          icon: createIcon(),
          title: `📍 Tu ubicación actual`,
          optimized: false,
        });

        // Crear círculo de precisión una sola vez
        accuracyCircleRef.current = new window.google.maps.Circle({
          strokeColor: '#EF4444', // Rojo para mejor visibilidad
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#EF4444', // Rojo para mejor visibilidad
          fillOpacity: 0.1,
          map: map,
          center: newCenter,
          radius: Math.max(location.accuracy, 15),
        });
      } else {
        // Solo actualizar posición del marcador existente
        markerRef.current.setPosition(newCenter);
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setCenter(newCenter);
          accuracyCircleRef.current.setRadius(Math.max(location.accuracy, 15));
        }
      }
    }
  }, [map, location, createIcon]);

  // useEffect separado para cambios de estado de tracking (sin recrear marcador)
  useEffect(() => {
    if (markerRef.current && accuracyCircleRef.current) {
      // Mantener el ícono rojo siempre (sin cambios por estado)
      markerRef.current.setIcon(createIcon());
      
      // Actualizar círculo de precisión
      accuracyCircleRef.current.setOptions({
        strokeColor: '#EF4444', // Rojo vibrante
        fillColor: '#EF4444', // Rojo vibrante
      });
    }
  }, [isTracking, createIcon]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

const GoogleMap = ({ location, isTracking }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-500 text-2xl">🗺️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps no configurado</h3>
          <p className="text-gray-600 text-sm">
            Configura tu API key en el archivo .env para ver el mapa
          </p>
        </div>
      </div>
    );
  }

  return (
    <Wrapper apiKey={apiKey} version="beta" libraries={['marker']}>
      <MapComponent location={location} isTracking={isTracking} />
    </Wrapper>
  );
};

export default GoogleMap;
