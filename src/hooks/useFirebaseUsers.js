import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, get, off } from 'firebase/database';

export const useFirebaseUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listenersRef = useRef({});

  // Cargar lista de usuarios activos
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData).map(userId => {
          const userData = usersData[userId];
          const currentPosition = userData.currentPosition;
          
          // Validar si el usuario está activo (menos de 1 hora)
          const isActive = currentPosition && 
                          currentPosition.timestamp && 
                          (Date.now() - currentPosition.timestamp) < (60 * 60 * 1000); // 1 hora
          
          return {
            id: userId,
            name: userId, // Por ahora usamos el ID como nombre
            currentPosition,
            isActive,
            lastSeen: currentPosition?.timestamp || Date.now()
          };
        });
        
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('[Firebase] Error cargando usuarios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar cambios de un usuario específico en tiempo real
  const watchUser = useCallback((userId, onPositionUpdate) => {
    if (!userId || !onPositionUpdate) return;

    const userRef = ref(db, `users/${userId}/currentPosition`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const position = snapshot.val();
        
        // Validar que la posición sea reciente (menos de 5 minutos)
        const isRecent = position.timestamp && 
                        (Date.now() - position.timestamp) < (5 * 60 * 1000);
        
        if (isRecent) {
          onPositionUpdate({
            userId,
            position,
            timestamp: position.timestamp
          });
        }
      }
    }, (error) => {
      console.error(`[Firebase] Error escuchando usuario ${userId}:`, error);
    });

    // Guardar referencia del listener
    listenersRef.current[userId] = unsubscribe;
    
    return () => {
      if (listenersRef.current[userId]) {
        off(userRef);
        delete listenersRef.current[userId];
      }
    };
  }, []);

  // Detener escucha de un usuario específico
  const stopWatchingUser = useCallback((userId) => {
    if (listenersRef.current[userId]) {
      const userRef = ref(db, `users/${userId}/currentPosition`);
      off(userRef);
      delete listenersRef.current[userId];
    }
  }, []);

  // Cargar histórico de un usuario para un día específico
  const loadUserHistory = useCallback(async (userId, date) => {
    try {
      const historyRef = ref(db, `users/${userId}/history/${date}/positions`);
      const snapshot = await get(historyRef);
      
      if (snapshot.exists()) {
        const positions = snapshot.val();
        return Object.keys(positions).map(key => ({
          id: key,
          ...positions[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
      }
      
      return [];
    } catch (err) {
      console.error(`[Firebase] Error cargando histórico de ${userId}:`, err);
      throw err;
    }
  }, []);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar todos los listeners activos
      Object.keys(listenersRef.current).forEach(userId => {
        const userRef = ref(db, `users/${userId}/currentPosition`);
        off(userRef);
      });
      listenersRef.current = {};
    };
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
    watchUser,
    stopWatchingUser,
    loadUserHistory
  };
};

export default useFirebaseUsers;
