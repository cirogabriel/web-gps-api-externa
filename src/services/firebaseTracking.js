// Firebase configuration and real-time tracking service
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get } from 'firebase/database'

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

// Servicio para manejo de tracking en tiempo real con trayectorias continuas
export class FirebaseTrackingService {
  constructor() {
    this.currentUserId = null
    this.listeners = new Map()
    this.trajectoryListeners = new Map()
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

  // Limpiar todos los listeners incluyendo trayectorias
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    })
    this.listeners.clear()
    
    this.clearTrajectoryListeners();
    
    if (this.currentUserId) {
      this.stopTracking()
    }
  }

  // Obtener el ID del tracker actual
  getCurrentUserId() {
    return this.currentUserId
  }

  // Enviar ubicación con registro de trayectoria
  async sendLocationWithTrajectory(location) {
    if (!this.currentUserId) return;

    const locationData = {
      ...location,
      userId: this.currentUserId,
      timestamp: Date.now(),
      id: `${this.currentUserId}_${Date.now()}`
    };

    try {
      // Actualizar ubicación actual
      await set(ref(database, `locations/${this.currentUserId}`), locationData);
      
      // Registrar en trayectoria (para visualización continua)
      await set(ref(database, `trajectories/${this.currentUserId}/${Date.now()}`), locationData);
      
      console.log('[Firebase] Ubicación y trayectoria enviadas:', locationData);
    } catch (error) {
      console.error('[Firebase] Error enviando ubicación:', error);
      throw error;
    }
  }

  // Obtener trayectoria de un usuario específico
  getUserTrajectory(userId, callback) {
    const trajectoryRef = ref(database, `trajectories/${userId}`);
    const unsubscribe = onValue(trajectoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir a array ordenado por timestamp
        const trajectory = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        callback(trajectory);
      } else {
        callback([]);
      }
    });

    this.trajectoryListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Obtener trayectorias de múltiples usuarios
  getMultipleTrajectories(userIds, callback) {
    const trajectories = {};
    let completedUsers = 0;

    userIds.forEach(userId => {
      this.getUserTrajectory(userId, (trajectory) => {
        trajectories[userId] = trajectory;
        completedUsers++;
        
        if (completedUsers === userIds.length) {
          callback(trajectories);
        }
      });
    });
  }

  // Obtener trayectoria por rango de fechas
  getUserTrajectoryByDateRange(userId, startDate, endDate, callback) {
    const trajectoryRef = ref(database, `trajectories/${userId}`);
    const trajectoryQuery = query(
      trajectoryRef, 
      orderByChild('timestamp'),
      limitToLast(1000) // Últimas 1000 posiciones
    );

    const unsubscribe = onValue(trajectoryQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const trajectory = Object.values(data)
          .filter(point => point.timestamp >= startDate && point.timestamp <= endDate)
          .sort((a, b) => a.timestamp - b.timestamp);
        callback(trajectory);
      } else {
        callback([]);
      }
    });

    return unsubscribe;
  }

  // Limpiar listeners de trayectorias
  clearTrajectoryListeners() {
    this.trajectoryListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.trajectoryListeners.clear();
  }

  // Obtener usuarios activos (ubicaciones recientes)
  async getActiveUsers() {
    try {
      const locationsRef = ref(database, 'locations');
      const snapshot = await get(locationsRef);
      
      if (snapshot.exists()) {
        const locations = snapshot.val();
        const activeUsers = [];
        const currentTime = Date.now();
        const fiveMinutesAgo = currentTime - (5 * 60 * 1000); // 5 minutos

        Object.keys(locations).forEach(userId => {
          const location = locations[userId];
          // Solo usuarios activos en los últimos 5 minutos
          if (location.timestamp && location.timestamp > fiveMinutesAgo) {
            activeUsers.push({
              id: userId,
              name: location.userName || `Usuario ${userId.slice(-4)}`,
              ...location
            });
          }
        });

        return activeUsers;
      }
      
      return [];
    } catch (error) {
      console.error('[Firebase] Error obteniendo usuarios activos:', error);
      return [];
    }
  }
}
