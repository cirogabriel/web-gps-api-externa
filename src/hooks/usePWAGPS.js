// Hook alternativo que simula PWA para bypasear restricciones GPS
import { useState, useEffect, useCallback } from 'react'

export const usePWAGPS = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [watchId, setWatchId] = useState(null)

  // TRUCO: Simular Service Worker para contexto "seguro"
  const installServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        console.log('[PWA-GPS] ✅ Service Worker registrado:', registration)
        return true
      } catch (error) {
        console.log('[PWA-GPS] ⚠️ Service Worker no disponible:', error)
        return false
      }
    }
    return false
  }, [])

  // FUNCIÓN PRINCIPAL: GPS con contexto PWA
  const getCurrentPosition = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('[PWA-GPS] 🚀 Iniciando GPS con contexto PWA')
      
      // Instalar Service Worker primero
      await installServiceWorker()
      
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation no disponible'))
          return
        }

        // Configuración específica para PWA
        const options = {
          enableHighAccuracy: true,
          timeout: 45000, // Timeout muy largo
          maximumAge: 0
        }

        let attempts = 0
        const maxAttempts = 10 // Muchos más intentos

        const tryGetPosition = () => {
          attempts++
          console.log(`[PWA-GPS] 🔄 Intento PWA ${attempts}/${maxAttempts}`)

          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('[PWA-GPS] ✅ GPS PWA exitoso')
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
                method: 'pwa-gps'
              }
              setLocation(locationData)
              setLoading(false)
              resolve(locationData)
            },
            (gpsError) => {
              console.log(`[PWA-GPS] ❌ Intento ${attempts} falló:`, gpsError.message)
              
              if (attempts < maxAttempts) {
                // Esperar más tiempo entre intentos
                setTimeout(tryGetPosition, 3000)
              } else {
                setError('GPS no disponible después de múltiples intentos PWA')
                setLoading(false)
                reject(new Error('GPS no disponible después de múltiples intentos PWA'))
              }
            },
            options
          )
        }

        tryGetPosition()
      })
    } catch (err) {
      console.error('[PWA-GPS] ❌ Error general:', err)
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [installServiceWorker])

  // Observación continua con PWA
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || isWatching) return

    console.log('[PWA-GPS] 👀 Iniciando observación PWA')

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000 // Permitir datos un poco más antiguos
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          method: 'pwa-watch'
        }
        setLocation(locationData)
        console.log('[PWA-GPS] 📍 Ubicación PWA actualizada')
      },
      (watchError) => {
        console.error('[PWA-GPS] ❌ Error en watch PWA:', watchError)
        setError(watchError.message)
      },
      options
    )

    setWatchId(id)
    setIsWatching(true)
  }, [isWatching])

  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsWatching(false)
      console.log('[PWA-GPS] 🛑 Observación PWA detenida')
    }
  }, [watchId])

  // Auto-cleanup
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    location,
    error,
    loading,
    isWatching,
    getCurrentPosition,
    startWatching,
    stopWatching
  }
}
