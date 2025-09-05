// Configuración específica para forzar GPS en HTTP
export const HTTP_GPS_CONFIG = {
  // Configuraciones para diferentes navegadores
  chrome: {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    // Chrome en HTTP puede funcionar con estas opciones
    forceRequest: true
  },
  firefox: {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 1000,
    // Firefox es más estricto pero estas opciones ayudan
    requireSecureOrigin: false
  },
  safari: {
    enableHighAccuracy: false, // Safari HTTP funciona mejor con false
    timeout: 20000,
    maximumAge: 2000
  },
  mobile: {
    enableHighAccuracy: true,
    timeout: 45000, // Móviles necesitan más tiempo
    maximumAge: 0
  }
}

// Detectar navegador y dispositivo
export const detectEnvironment = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  let browser = 'chrome' // default
  if (userAgent.includes('firefox')) browser = 'firefox'
  else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'safari'
  
  return {
    browser,
    isMobile,
    platform: isMobile ? 'mobile' : 'desktop'
  }
}

// Función que FUERZA el GPS en HTTP usando trucos específicos - SOLO GPS REAL
export const forceHTTPGeolocation = () => {
  const env = detectEnvironment()
  const config = env.isMobile ? HTTP_GPS_CONFIG.mobile : HTTP_GPS_CONFIG[env.browser]
  
  console.log(`[HTTP-GPS] 🎯 Configurando GPS REAL para ${env.browser} ${env.platform}`)
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation no disponible'))
      return
    }

    // TRUCO 1: Intentar GPS directo con configuración agresiva
    const attemptDirectAccess = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[HTTP-GPS] ✅ GPS directo exitoso')
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            method: 'direct-gps'
          })
        },
        () => {
          console.log('[HTTP-GPS] ⚠️ GPS directo falló, intentando método agresivo')
          attemptAggressiveAccess()
        },
        config
      )
    }

    // TRUCO 2: Método agresivo con múltiples intentos
    const attemptAggressiveAccess = () => {
      const aggressiveConfig = {
        ...config,
        timeout: 15000, // Más tiempo para GPS real
        maximumAge: 0   // Siempre pedir nueva ubicación
      }

      let attempts = 0
      const maxAttempts = 5 // Más intentos para GPS real

      const tryGetLocation = () => {
        attempts++
        console.log(`[HTTP-GPS] 🔄 Intento GPS REAL ${attempts}/${maxAttempts}`)

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('[HTTP-GPS] ✅ GPS agresivo exitoso')
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              method: 'aggressive-gps'
            })
          },
          (error) => {
            console.log(`[HTTP-GPS] ❌ Intento ${attempts} falló:`, error.message)
            
            if (attempts < maxAttempts) {
              // Esperar más tiempo entre intentos para GPS real
              setTimeout(tryGetLocation, 2000)
            } else {
              console.log('[HTTP-GPS] ❌ TODOS los intentos GPS fallaron')
              reject(new Error('GPS no disponible después de múltiples intentos'))
            }
          },
          aggressiveConfig
        )
      }

      tryGetLocation()
    }

    // Iniciar el proceso
    attemptDirectAccess()
  })
}

// Función para observación continua en HTTP
export const startHTTPLocationWatch = (callback, errorCallback) => {
  const env = detectEnvironment()
  const config = env.isMobile ? HTTP_GPS_CONFIG.mobile : HTTP_GPS_CONFIG[env.browser]
  
  console.log('[HTTP-GPS] 👀 Iniciando observación continua')
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        method: 'watch-gps'
      }
      console.log('[HTTP-GPS] 📍 Ubicación actualizada via watch')
      callback(location)
    },
    (error) => {
      console.error('[HTTP-GPS] ❌ Error en watch:', error)
      if (errorCallback) errorCallback(error)
    },
    {
      ...config,
      timeout: 15000, // Timeout más corto para watch
      maximumAge: 5000 // Permitir ubicaciones un poco más antiguas
    }
  )
  
  return watchId
}
