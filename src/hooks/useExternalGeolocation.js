import { useState, useEffect } from "react"

// Hook para geolocalización usando APIs externas (funciona con HTTP)
export const useExternalGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Función para obtener ubicación usando IP Geolocation API (gratuita)
  const getLocationByIP = async () => {
    setLoading(true)
    try {
      // Usamos ipapi.co que es gratuito y no requiere API key
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      if (data.latitude && data.longitude) {
        const locationData = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 10000, // La precisión por IP es aproximada (10km)
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          city: data.city,
          region: data.region,
          country: data.country_name,
          source: 'ip_geolocation'
        }
        setLocation(locationData)
        setError(null)
        console.log("[External GPS] Location by IP:", locationData)
      } else {
        throw new Error("No se pudo obtener la ubicación por IP")
      }
    } catch (err) {
      console.error("[External GPS] Error:", err)
      setError(`Error al obtener ubicación: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Función alternativa usando otra API gratuita
  const getLocationByIPInfo = async () => {
    setLoading(true)
    try {
      // API alternativa gratuita
      const response = await fetch('https://ipinfo.io/json')
      const data = await response.json()
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',')
        const locationData = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          accuracy: 10000,
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          city: data.city,
          region: data.region,
          country: data.country,
          source: 'ipinfo_geolocation'
        }
        setLocation(locationData)
        setError(null)
        console.log("[External GPS] Location by IPInfo:", locationData)
      } else {
        throw new Error("No se pudo obtener la ubicación")
      }
    } catch (err) {
      console.error("[External GPS] Error:", err)
      setError(`Error al obtener ubicación: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Función principal que intenta múltiples APIs
  const getCurrentPosition = async () => {
    try {
      await getLocationByIP()
    } catch (err) {
      console.log("[External GPS] Primera API falló:", err.message, "- intentando alternativa...")
      try {
        await getLocationByIPInfo()
      } catch (secondErr) {
        console.error("[External GPS] Segunda API también falló:", secondErr.message)
        setError("No se pudo obtener la ubicación por ningún método")
      }
    }
  }

  return { location, error, loading, getCurrentPosition }
}

// Hook híbrido que intenta primero el navegador y luego APIs externas
export const useHybridGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [locationSource, setLocationSource] = useState(null)
  const [watchId, setWatchId] = useState(null)
  const [intervalId, setIntervalId] = useState(null)

  // Función para obtener ubicación del navegador
  const getLocationFromNavigator = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            source: 'navigator'
          })
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options,
        }
      )
    })
  }

  // Función para obtener ubicación por IP
  const getLocationFromIP = async () => {
    try {
      // Usar IPinfo con token si está disponible
      const token = import.meta.env.VITE_IPINFO_TOKEN
      const url = token ? `https://ipinfo.io/json?token=${token}` : 'https://ipinfo.io/json'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',')
        return {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          accuracy: 10000,
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          city: data.city,
          region: data.region,
          country: data.country,
          source: 'ip_geolocation'
        }
      }
    } catch (err) {
      console.log("[Hybrid GPS] IPinfo falló:", err.message, "- intentando API alternativa...")
    }

    // Fallback a ipapi.co si IPinfo falla
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 10000,
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          city: data.city,
          region: data.region,
          country: data.country_name,
          source: 'ip_geolocation'
        }
      }
    } catch (err) {
      console.error("[Hybrid GPS] Todas las APIs de IP fallaron:", err)
    }
    
    throw new Error("No se pudo obtener ubicación por IP")
  }

  // Función principal que intenta ambos métodos
  const getCurrentPosition = async () => {
    setLoading(true)
    setError(null)

    try {
      // Primero intenta con el navegador (más preciso)
      console.log("[Hybrid GPS] Intentando geolocalización del navegador...")
      const navLocation = await getLocationFromNavigator()
      setLocation(navLocation)
      setLocationSource('navigator')
      console.log("[Hybrid GPS] Ubicación obtenida del navegador:", navLocation)
    } catch (navError) {
      console.log("[Hybrid GPS] Navegador falló:", navError.message)
      
      try {
        // Si falla, usa la API externa
        console.log("[Hybrid GPS] Intentando geolocalización por IP...")
        const ipLocation = await getLocationFromIP()
        setLocation(ipLocation)
        setLocationSource('ip')
        console.log("[Hybrid GPS] Ubicación obtenida por IP:", ipLocation)
        setError("Ubicación aproximada obtenida por IP (menos precisa)")
      } catch (ipError) {
        console.error("[Hybrid GPS] Ambos métodos fallaron:", ipError)
        setError("No se pudo obtener la ubicación")
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para tracking continuo (híbrido)
  const startWatching = () => {
    if (navigator.geolocation) {
      // Si el navegador soporta geolocalización, usar watchPosition
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            source: 'navigator_watch'
          }
          setLocation(locationData)
          setLocationSource('navigator')
          setError(null)
          console.log("[Hybrid GPS] Watch position actualizada:", locationData)
        },
        (err) => {
          console.error("[Hybrid GPS] Watch error:", err)
          setError(`Error de seguimiento GPS: ${err.message}`)
          // Fallback a actualizaciones por IP cada 30 segundos
          startIPTracking()
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache por 1 minuto
          ...options,
        }
      )
      setWatchId(id)
    } else {
      // Si no hay soporte de geolocalización, usar tracking por IP
      startIPTracking()
    }
  }

  // Función para tracking usando IP (actualizaciones cada 30 segundos)
  const startIPTracking = () => {
    // Obtener ubicación inicial
    getCurrentPosition()
    
    // Configurar actualizaciones cada 30 segundos
    const id = setInterval(async () => {
      try {
        console.log("[Hybrid GPS] Actualizando ubicación por IP...")
        const ipLocation = await getLocationFromIP()
        setLocation(ipLocation)
        setLocationSource('ip')
        setError("Seguimiento por IP - Ubicación aproximada")
      } catch (err) {
        console.error("[Hybrid GPS] Error en actualización por IP:", err)
      }
    }, 30000) // 30 segundos
    
    setIntervalId(id)
  }

  const stopWatching = () => {
    // Detener watchPosition si existe
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    
    // Detener interval si existe
    if (intervalId !== null) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    
    console.log("[Hybrid GPS] Seguimiento detenido")
  }

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      // Detener watchPosition si existe
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      
      // Detener interval si existe
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
    }
  }, [watchId, intervalId])

  return { 
    location, 
    error, 
    loading, 
    locationSource,
    getCurrentPosition, 
    startWatching, 
    stopWatching 
  }
}
