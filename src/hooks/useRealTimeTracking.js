import { useState, useEffect, useCallback } from 'react'
import { FirebaseTrackingService } from '../services/firebaseTracking'

// Hook para el usuario que será rastreado (tracker)
export const useTracker = (userName = 'Usuario') => {
  const [trackingService] = useState(() => new FirebaseTrackingService())
  const [trackerId, setTrackerId] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState(null)

  // Inicializar tracker
  const startSharing = useCallback(() => {
    try {
      const id = trackingService.initializeTracker(userName)
      setTrackerId(id)
      setIsSharing(true)
      setError(null)
      console.log('[Tracker] Compartir ubicación iniciado:', id)
    } catch (err) {
      setError(err.message)
      console.error('[Tracker] Error:', err)
    }
  }, [trackingService, userName])

  // Detener sharing
  const stopSharing = useCallback(() => {
    trackingService.stopTracking()
    setIsSharing(false)
    setTrackerId(null)
    console.log('[Tracker] Compartir ubicación detenido')
  }, [trackingService])

  // Enviar ubicación
  const shareLocation = useCallback(async (location) => {
    if (!isSharing || !location) return
    
    try {
      await trackingService.sendLocation(location)
    } catch (err) {
      setError(err.message)
      console.error('[Tracker] Error enviando ubicación:', err)
    }
  }, [trackingService, isSharing])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      trackingService.cleanup()
    }
  }, [trackingService])

  return {
    trackerId,
    isSharing,
    error,
    startSharing,
    stopSharing,
    shareLocation
  }
}

// Hook para el observador que ve las ubicaciones
export const useLocationWatcher = () => {
  const [trackingService] = useState(() => new FirebaseTrackingService())
  const [watchedUsers, setWatchedUsers] = useState([])
  const [currentLocation, setCurrentLocation] = useState(null)
  const [watchedUserId, setWatchedUserId] = useState(null)
  const [error, setError] = useState(null)

  // Obtener usuarios activos
  const loadActiveUsers = useCallback(() => {
    try {
      trackingService.subscribeToActiveUsers((users) => {
        setWatchedUsers(users)
        console.log('[Watcher] Usuarios activos:', users)
      })
    } catch (err) {
      setError(err.message)
    }
  }, [trackingService])

  // Empezar a observar un usuario específico
  const watchUser = useCallback((userId) => {
    if (watchedUserId) {
      // Detener observación anterior
      trackingService.cleanup()
    }

    try {
      trackingService.subscribeToUserLocation(userId, (location) => {
        setCurrentLocation(location)
        console.log('[Watcher] Nueva ubicación de usuario:', location)
      })
      setWatchedUserId(userId)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [trackingService, watchedUserId])

  // Detener observación
  const stopWatching = useCallback(() => {
    trackingService.cleanup()
    setCurrentLocation(null)
    setWatchedUserId(null)
    console.log('[Watcher] Observación detenida')
  }, [trackingService])

  // Inicializar carga de usuarios
  useEffect(() => {
    loadActiveUsers()
  }, [loadActiveUsers])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      trackingService.cleanup()
    }
  }, [trackingService])

  return {
    watchedUsers,
    currentLocation,
    watchedUserId,
    error,
    watchUser,
    stopWatching,
    loadActiveUsers
  }
}
