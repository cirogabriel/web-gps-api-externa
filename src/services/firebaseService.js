// Firebase configuration and real-time tracking service
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDbPpPjBx7_zCURsko7hirzhyoVpuWhsg8",
  authDomain: "gps-tracker-ccfc7.firebaseapp.com",
  databaseURL: "https://gps-tracker-ccfc7-default-rtdb.firebaseio.com",
  projectId: "gps-tracker-ccfc7",
  storageBucket: "gps-tracker-ccfc7.firebasestorage.app",
  messagingSenderId: "816013828212",
  appId: "1:816013828212:web:9a92e804c7f7170a88b121"
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

export class FirebaseTrackingService {
  constructor() {
    this.currentUserId = null
    this.listeners = new Map()
  }

  initializeTracker() {
    this.currentUserId = `user_${Math.random().toString(36).substring(2)}_${Date.now()}`
    console.log('[Firebase] ✅ Tracker iniciado:', this.currentUserId)
    return this.currentUserId
  }

  async sendLocation(locationData) {
    if (!this.currentUserId) return
    
    try {
      const userRef = ref(database, `users/${this.currentUserId}`)
      await set(userRef, {
        ...locationData,
        userId: this.currentUserId,
        name: 'Tracker Activo',
        timestamp: Date.now(),
        isActive: true
      })
      console.log('[Firebase] 📍 Ubicación enviada exitosamente')
    } catch (error) {
      console.error('[Firebase] ❌ Error enviando ubicación:', error)
    }
  }

  subscribeToActiveUsers(callback) {
    const usersRef = ref(database, 'users')
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      const now = Date.now()
      const activeTimeLimit = 5 * 60 * 1000 // 5 minutos
      
      const users = data ? Object.values(data).filter(user => {
        // Solo usuarios que están marcados como activos Y tienen actividad reciente
        const isRecentlyActive = user.timestamp && (now - user.timestamp) < activeTimeLimit
        return user.isActive === true && isRecentlyActive
      }) : []
      
      console.log('[Firebase] 👥 Usuarios realmente activos:', users.length)
      callback(users)
    })
    this.listeners.set('activeUsers', unsubscribe)
    return unsubscribe
  }

  subscribeToUserLocation(userId, callback) {
    console.log('[Firebase] 👀 Observando usuario:', userId)
    
    if (this.listeners.has(userId)) {
      this.listeners.get(userId)()
      this.listeners.delete(userId)
    }
    
    const userRef = ref(database, `users/${userId}`)
    const unsubscribe = onValue(userRef, (snapshot) => {
      const location = snapshot.val()
      if (location) {
        console.log('[Firebase] 📍 Nueva ubicación recibida:', location)
        callback(location)
      }
    })
    
    this.listeners.set(userId, unsubscribe)
    return unsubscribe
  }

  stopTracking() {
    if (this.currentUserId) {
      const userRef = ref(database, `users/${this.currentUserId}`)
      set(userRef, {
        userId: this.currentUserId,
        name: 'Usuario Desconectado',
        isActive: false,
        lastSeen: Date.now()
      })
      this.currentUserId = null
      console.log('[Firebase] 🛑 Tracking detenido')
    }
  }

  cleanup() {
    console.log('[Firebase] 🧹 Limpiando listeners...')
    this.listeners.forEach((unsubscribe) => {
      try {
        unsubscribe()
      } catch (error) {
        console.error('[Firebase] Error limpiando listener:', error)
      }
    })
    this.listeners.clear()
  }

  getCurrentUserId() {
    return this.currentUserId
  }
}
