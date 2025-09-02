import { useState } from "react"

// Hook personalizado para manejar la geolocalización
export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada")
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
        })
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    )
  }

  return { location, error, loading, getCurrentPosition }
}

// Hook para formatear coordenadas
export const useLocationFormatter = () => {
  const formatCoordinates = (lat, lng, precision = 6) => {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
  }

  const formatLatitude = (lat, precision = 6) => {
    const direction = lat >= 0 ? 'N' : 'S'
    return `${Math.abs(lat).toFixed(precision)}° ${direction}`
  }

  const formatLongitude = (lng, precision = 6) => {
    const direction = lng >= 0 ? 'E' : 'W'
    return `${Math.abs(lng).toFixed(precision)}° ${direction}`
  }

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatSpeed = (speedMps) => {
    if (!speedMps) return "0 km/h"
    return `${Math.round(speedMps * 3.6)} km/h`
  }

  return {
    formatCoordinates,
    formatLatitude,
    formatLongitude,
    formatDistance,
    formatSpeed,
  }
}
