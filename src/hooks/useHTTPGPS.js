// Hook que FUERZA el GPS en HTTP usando todas las técnicas disponibles
import { useState, useEffect, useCallback } from 'react'
import { forceHTTPGeolocation, startHTTPLocationWatch } from '../utils/httpGpsForcer'

export const useHTTPGPS = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [watchId, setWatchId] = useState(null)

  // FUNCIÓN PRINCIPAL: Obtener ubicación SOLO CON GPS REAL
  const getCurrentPosition = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('[HTTP-GPS] 🚀 Iniciando GPS REAL (sin fallbacks)')
      const locationData = await forceHTTPGeolocation()
      
      // SOLO ACEPTAR GPS REAL
      if (locationData.method === 'direct-gps' || locationData.method === 'aggressive-gps') {
        setLocation(locationData)
        setLoading(false)
        console.log('[HTTP-GPS] ✅ GPS REAL obtenido:', locationData)
        return locationData
      } else {
        throw new Error('Solo GPS real permitido')
      }
    } catch (err) {
      console.error('[HTTP-GPS] ❌ GPS REAL no disponible:', err)
      setError('GPS no disponible. Solo se permite GPS real.')
      setLoading(false)
      throw err
    }
  }, [])

  // Observación continua usando la función del forcer
  const startWatching = useCallback(() => {
    if (isWatching) return

    console.log('[HTTP-GPS] 👀 Iniciando observación continua')
    
    const watchId = startHTTPLocationWatch(
      (locationData) => {
        setLocation(locationData)
        console.log('[HTTP-GPS] 📍 Ubicación actualizada:', locationData)
      },
      (error) => {
        console.error('[HTTP-GPS] ❌ Error en observación:', error)
        setError(error.message)
      }
    )

    setWatchId(watchId)
    setIsWatching(true)
  }, [isWatching])

  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsWatching(false)
      console.log('[ForceGPS] 🛑 Observación detenida')
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
