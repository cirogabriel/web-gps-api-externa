// Firebase configuration and real-time tracking service
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// Tu configuración de Firebase (debes crear un proyecto en Firebase Console)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Configuración de fallback para desarrollo (usa tu propia configuración)
const fallbackConfig = {
  apiKey: "demo-api-key",
  authDomain: "gps-tracker-demo.firebaseapp.com",
  databaseURL: "https://gps-tracker-demo-default-rtdb.firebaseio.com/",
  projectId: "gps-tracker-demo",
  storageBucket: "gps-tracker-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
}

const config = firebaseConfig.apiKey ? firebaseConfig : fallbackConfig
const app = initializeApp(config)
const database = getDatabase(app)

// Servicio para manejo de tracking en tiempo real
export class FirebaseTrackingService {
  constructor() {
    this.currentUserId = null
    this.listeners = new Map()
  }

  // Generar ID único para el usuario
  generateUserId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Inicializar usuario tracker (el que será rastreado)
  initializeTracker(userName = 'Usuario') {
    this.currentUserId = this.generateUserId()
    const userRef = ref(database, `users/${this.currentUserId}`)
    
    set(userRef, {
      id: this.currentUserId,
      name: userName,
      isActive: true,
      lastSeen: Date.now(),
      createdAt: Date.now()
    })

    console.log(`[Firebase] Tracker iniciado con ID: ${this.currentUserId}`)
    return this.currentUserId
  }

  // Enviar ubicación del tracker
  async sendLocation(locationData) {
    if (!this.currentUserId) {
      throw new Error('Debe inicializar el tracker primero')
    }

    const locationRef = ref(database, `locations/${this.currentUserId}`)
    
    const dataToSend = {
      ...locationData,
      userId: this.currentUserId,
      timestamp: Date.now(),
      id: Date.now().toString()
    }

    try {
      await set(locationRef, dataToSend)
      
      // También actualizar el estado del usuario
      const userRef = ref(database, `users/${this.currentUserId}`)
      await set(userRef, {
        id: this.currentUserId,
        name: 'Tracker Activo',
        isActive: true,
        lastSeen: Date.now(),
        currentLocation: dataToSend
      })

      console.log('[Firebase] Ubicación enviada:', dataToSend)
      return dataToSend
    } catch (error) {
      console.error('[Firebase] Error enviando ubicación:', error)
      throw error
    }
  }

  // Escuchar actualizaciones de ubicación de un usuario específico
  subscribeToUserLocation(userId, callback) {
    const locationRef = ref(database, `locations/${userId}`)
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        console.log('[Firebase] Nueva ubicación recibida:', data)
        callback(data)
      }
    })

    this.listeners.set(userId, unsubscribe)
    return unsubscribe
  }

  // Obtener lista de usuarios activos
  subscribeToActiveUsers(callback) {
    const usersRef = ref(database, 'users')
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const users = snapshot.val()
      if (users) {
        const activeUsers = Object.values(users).filter(user => 
          user.isActive && (Date.now() - user.lastSeen) < 300000 // Activo en últimos 5 minutos
        )
        callback(activeUsers)
      } else {
        callback([])
      }
    })

    this.listeners.set('activeUsers', unsubscribe)
    return unsubscribe
  }

  // Detener tracking del usuario actual
  stopTracking() {
    if (this.currentUserId) {
      const userRef = ref(database, `users/${this.currentUserId}`)
      set(userRef, {
        id: this.currentUserId,
        name: 'Tracker Inactivo',
        isActive: false,
        lastSeen: Date.now()
      })
      
      console.log('[Firebase] Tracking detenido')
      this.currentUserId = null
    }
  }

  // Limpiar todos los listeners
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    })
    this.listeners.clear()
    
    if (this.currentUserId) {
      this.stopTracking()
    }
  }

  // Obtener el ID del tracker actual
  getCurrentUserId() {
    return this.currentUserId
  }
}
