import React, { useRef, useEffect, useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

const MapComponent = ({ location, isTracking }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Inicializar mapa
  useEffect(() => {
    if (!map && mapRef.current && window.google) {
      // Centro por defecto (Madrid, España) si no hay ubicación
      const defaultCenter = { lat: 40.4168, lng: -3.7038 };
      const center = location ? { lat: location.latitude, lng: location.longitude } : defaultCenter;
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: location ? 15 : 10,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
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
          }
        ]
      });
      setMap(newMap);
    }
  }, [map, location]);

  useEffect(() => {
    if (map && location) {
      // Actualizar centro del mapa
      const newCenter = { lat: location.latitude, lng: location.longitude };
      map.setCenter(newCenter);

      // Crear o actualizar marcador
      if (marker) {
        marker.setPosition(newCenter);
      } else {
        const newMarker = new window.google.maps.Marker({
          position: newCenter,
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: isTracking ? '#22c55e' : '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
          title: 'Tu ubicación'
        });
        setMarker(newMarker);
      }

      // Actualizar color del marcador según el estado de tracking
      if (marker) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: isTracking ? '#22c55e' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        });
      }
    }
  }, [map, location, isTracking, marker]);

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
