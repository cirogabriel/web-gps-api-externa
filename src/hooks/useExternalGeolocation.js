import { useState, useEffect } from "react"

// Constantes para optimización de precisión GPS
const GPS_PRECISION_CONFIG = {
  // Umbral de precisión mínima en metros (5m = milimétrica)
  ACCURACY_THRESHOLD: 5,
  // Número de lecturas para promedio de precisión
  BUFFER_SIZE: 5,
  // Timeout extendido para permitir mejor señal GPS
  HIGH_PRECISION_TIMEOUT: 60000,  // 60 segundos
  // Intervalo mínimo entre actualizaciones (milisegundos)
  MIN_UPDATE_INTERVAL: 1000,  // 1 segundo
  // Distancia mínima para considerar movimiento (metros)
  MIN_DISTANCE_THRESHOLD: 1   // 1 metro
}

// Función para calcular distancia entre dos puntos GPS (fórmula de Haversine)
const calculateDistance = (pos1, pos2) => {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = pos1.latitude * Math.PI/180
  const φ2 = pos2.latitude * Math.PI/180
  const Δφ = (pos2.latitude - pos1.latitude) * Math.PI/180
  const Δλ = (pos2.longitude - pos1.longitude) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distancia en metros
}

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

  // Función para obtener ubicación del navegador con MÁXIMA PRECISIÓN
  const getLocationFromNavigator = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"))
        return
      }

      let attempts = 0
      let bestPosition = null
      const maxAttempts = 5  // Aumentado para mayor precisión

      const tryPosition = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            attempts++
            
            // Guardar la posición más precisa (menor accuracy = más preciso)
            if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
              bestPosition = position
            }

            console.log(`[GPS] Intento ${attempts}: precisión ${position.coords.accuracy}m`)

            // Si tenemos precisión MILIMÉTRICA o llegamos al máximo, resolver
            if (position.coords.accuracy <= GPS_PRECISION_CONFIG.ACCURACY_THRESHOLD || attempts >= maxAttempts) {
              const result = {
                latitude: bestPosition.coords.latitude,
                longitude: bestPosition.coords.longitude,
                accuracy: bestPosition.coords.accuracy,
                timestamp: bestPosition.timestamp,
                speed: bestPosition.coords.speed || 0,
                heading: bestPosition.coords.heading || 0,
                source: 'navigator_optimized'
              }
              
              console.log(`[GPS] ¡Ubicación MILIMÉTRICA obtenida! Precisión: ${bestPosition.coords.accuracy.toFixed(2)}m`, {
                lat: result.latitude.toFixed(8),
                lng: result.longitude.toFixed(8)
              })
              
              resolve(result)
            } else {
              // Intentar de nuevo para mejor precisión
              setTimeout(tryPosition, 3000)  // Tiempo aumentado para mejor señal
            }
          },
          (err) => {
            if (attempts === 0) {
              reject(err)
            } else {
              // Si tenemos alguna posición, usarla
              if (bestPosition) {
                resolve({
                  latitude: bestPosition.coords.latitude,
                  longitude: bestPosition.coords.longitude,
                  accuracy: bestPosition.coords.accuracy,
                  timestamp: bestPosition.timestamp,
                  speed: bestPosition.coords.speed || 0,
                  heading: bestPosition.coords.heading || 0,
                  source: 'navigator_fallback'
                })
              } else {
                reject(err)
              }
            }
          },
          {
            enableHighAccuracy: true,                           // FORZAR GPS real con máxima precisión
            timeout: GPS_PRECISION_CONFIG.HIGH_PRECISION_TIMEOUT / maxAttempts,  // Timeout optimizado por intento
            maximumAge: 0,                                      // NO usar cache, siempre datos frescos
            ...options,
          }
        )
      }

      tryPosition()
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
      // Variables para filtrado de precisión optimizado
      let bestAccuracy = Infinity
      let locationBuffer = []
      let lastUpdate = 0
      let lastPosition = null
      
      // Si el navegador soporta geolocalización, usar watchPosition
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const accuracy = position.coords.accuracy || Infinity
          const currentTime = Date.now()
          
          // Verificar intervalo mínimo entre actualizaciones
          if (currentTime - lastUpdate < GPS_PRECISION_CONFIG.MIN_UPDATE_INTERVAL) {
            return
          }
          
          console.log(`[Hybrid GPS] Nueva lectura - Precisión: ${accuracy.toFixed(1)}m`)
          
          // Filtrar lecturas por precisión optimizada
          if (accuracy <= GPS_PRECISION_CONFIG.ACCURACY_THRESHOLD) {
            const currentPos = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: accuracy,
              timestamp: position.timestamp
            }
            
            // Verificar si hay movimiento significativo
            if (lastPosition) {
              const distance = calculateDistance(lastPosition, currentPos)
              if (distance < GPS_PRECISION_CONFIG.MIN_DISTANCE_THRESHOLD && accuracy > bestAccuracy * 1.5) {
                console.log(`[Hybrid GPS] Descartando lectura por movimiento mínimo: ${distance.toFixed(2)}m`)
                return
              }
            }
            
            // Agregar al buffer de posiciones precisas
            locationBuffer.push(currentPos)
            
            // Mantener solo las últimas lecturas para promedio
            if (locationBuffer.length > GPS_PRECISION_CONFIG.BUFFER_SIZE) {
              locationBuffer.shift()
            }
            
            // Calcular posición promediada para máxima precisión
            const avgLat = locationBuffer.reduce((sum, pos) => sum + pos.latitude, 0) / locationBuffer.length
            const avgLng = locationBuffer.reduce((sum, pos) => sum + pos.longitude, 0) / locationBuffer.length
            const avgAccuracy = locationBuffer.reduce((sum, pos) => sum + pos.accuracy, 0) / locationBuffer.length
            
            const locationData = {
              latitude: avgLat,
              longitude: avgLng,
              accuracy: avgAccuracy,
              timestamp: position.timestamp,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0,
              source: 'navigator_watch_precision'
            }
            
            setLocation(locationData)
            setLocationSource('navigator')
            setError(null)
            lastUpdate = currentTime
            lastPosition = currentPos
            
            console.log(`[Hybrid GPS] Posición MILIMÉTRICA actualizada (promedio de ${locationBuffer.length} lecturas):`, {
              lat: avgLat.toFixed(8),
              lng: avgLng.toFixed(8), 
              accuracy: avgAccuracy.toFixed(2)
            })
            
            // Actualizar mejor precisión alcanzada
            if (avgAccuracy < bestAccuracy) {
              bestAccuracy = avgAccuracy
              console.log(`[Hybrid GPS] ¡Nueva mejor precisión alcanzada: ${bestAccuracy.toFixed(2)}m!`)
            }
            
          } else {
            // Lectura imprecisa - usar solo si no tenemos mejores datos
            if (bestAccuracy === Infinity) {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: accuracy,
                timestamp: position.timestamp,
                speed: position.coords.speed || 0,
                heading: position.coords.heading || 0,
                source: 'navigator_watch_fallback'
              }
              setLocation(locationData)
              setLocationSource('navigator')
              setError(`GPS calibrando precisión: ${accuracy.toFixed(1)}m`)
              console.log(`[Hybrid GPS] Usando lectura temporal (${accuracy.toFixed(1)}m) - optimizando señal...`)
            } else {
              console.log(`[Hybrid GPS] Descartando lectura imprecisa: ${accuracy.toFixed(1)}m (mejor disponible: ${bestAccuracy.toFixed(1)}m)`)
            }
          }
        },
        (err) => {
          console.error("[Hybrid GPS] Watch error:", err)
          setError(`Error de seguimiento GPS: ${err.message}`)
          // Fallback a actualizaciones por IP cada 30 segundos
          startIPTracking()
        },
        {
          enableHighAccuracy: true,                           // GPS de máxima precisión
          timeout: GPS_PRECISION_CONFIG.HIGH_PRECISION_TIMEOUT,  // Timeout extendido para mejor señal
          maximumAge: 0,                                      // NO usar cache, siempre datos frescos
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
