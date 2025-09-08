import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, get, off, remove } from 'firebase/database';

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
        const data = snapshot.val();
        console.log('[Firebase] 📊 Usuarios encontrados:', Object.keys(data));
        
        const usersList = Object.entries(data).map(([userId, userData]) => ({
          id: userId,
          name: userData.name || userId,
          lastSeen: userData.lastSeen || Date.now(),
          isActive: userData.isActive || false,
          currentPosition: userData.currentPosition || null
        }));
        
        setUsers(usersList);
      } else {
        console.log('[Firebase] ⚠️ No hay usuarios en la base de datos');
        setUsers([]);
      }
    } catch (err) {
      console.error('[Firebase] ❌ Error cargando usuarios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Obtener posición actual de un usuario (SIMPLE Y DIRECTO)
  const getCurrentPosition = useCallback(async (userId) => {
    try {
      console.log(`[Firebase] 🎯 Obteniendo posición actual de ${userId}...`);
      
      const positionRef = ref(db, `users/${userId}/currentPosition`);
      const snapshot = await get(positionRef);
      
      if (snapshot.exists()) {
        const position = snapshot.val();
        console.log(`[Firebase] ✅ Posición encontrada para ${userId}:`, position);
        
        // Retornar en el formato exacto que necesita el mapa
        return {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: position.timestamp,
          userId: userId
        };
      } else {
        console.log(`[Firebase] ⚠️ No hay posición actual para ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`[Firebase] ❌ Error obteniendo posición de ${userId}:`, error);
      return null;
    }
  }, []);

  // Escuchar cambios en tiempo real de un usuario específico
  const watchUserPosition = useCallback((userId, onPositionUpdate = null) => {
    console.log(`[Firebase] 👁️ Iniciando seguimiento en vivo de ${userId}`);
    
    const userRef = ref(db, `users/${userId}/currentPosition`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const position = snapshot.val();
        console.log(`[Firebase] 📍 Nueva posición de ${userId}:`, position);
        
        // Crear objeto de posición completo
        const positionData = {
          lat: position.latitude,
          lng: position.longitude,
          accuracy: position.accuracy || 0,
          timestamp: position.timestamp || Date.now(),
          savedAt: position.savedAt || position.timestamp || Date.now()
        };
        
        // Actualizar el usuario en la lista
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, currentPosition: position, lastSeen: Date.now() }
              : user
          )
        );
        
        // Notificar al callback si existe (para el mapa)
        if (onPositionUpdate && typeof onPositionUpdate === 'function') {
          onPositionUpdate(userId, positionData);
        }
      } else {
        console.log(`[Firebase] ⚠️ No hay posición actual para ${userId}`);
      }
    }, (error) => {
      console.error(`[Firebase] ❌ Error escuchando posición de ${userId}:`, error);
    });

    // Guardar referencia para poder cancelar después
    listenersRef.current[userId] = unsubscribe;
    
    return unsubscribe;
  }, []);

  // Detener escucha de un usuario específico
  const stopWatchingUser = useCallback((userId) => {
    if (listenersRef.current[userId]) {
      const userRef = ref(db, `users/${userId}/currentPosition`);
      off(userRef);
      delete listenersRef.current[userId];
    }
  }, []);

  // Función para cargar histórico por rango de timestamps con nueva estructura por fechas
  const loadUserHistoryByRange = useCallback(async (userId, startTimestamp, endTimestamp) => {
    try {
      console.log(`[Firebase] 📈 Cargando histórico de ${userId} por rango de timestamps`);
      console.log(`[Firebase] 🕐 Inicio: ${new Date(startTimestamp).toISOString()}`);
      console.log(`[Firebase] 🕐 Fin: ${new Date(endTimestamp).toISOString()}`);
      console.log(`[Firebase] 🔗 Ruta: users/${userId}/history`);
      
      const historyRef = ref(db, `users/${userId}/history`);
      const snapshot = await get(historyRef);
      
      if (!snapshot.exists()) {
        console.log(`[Firebase] ⚠️ No hay datos de histórico para ${userId}`);
        return [];
      }

      const history = snapshot.val();
      const allPositions = [];

      console.log(`[Firebase] 📊 Fechas encontradas en Firebase:`, Object.keys(history));
      console.log(`[Firebase] 🕐 Rango de timestamps: ${startTimestamp} - ${endTimestamp}`);

      // Recorrer TODAS las fechas en el histórico (sin filtrar por fecha)
      Object.keys(history).forEach(dateKey => {
        try {
          console.log(`[Firebase] 📅 Procesando fecha: ${dateKey}`);
          
          const dayData = history[dateKey];
          const positionsObj = dayData.positions || {};
          
          console.log(`[Firebase] 📊 Posiciones en ${dateKey}:`, Object.keys(positionsObj).length);
          
          // Procesar cada posición del día
          Object.values(positionsObj).forEach(pos => {
            // Usar savedAt si existe, sino usar timestamp
            const posTimestamp = pos.savedAt || pos.timestamp;
            
            console.log(`[Firebase] 🔍 Evaluando posición:`, {
              dateKey,
              posTimestamp,
              posDate: new Date(posTimestamp).toISOString(),
              startTimestamp,
              endTimestamp,
              isInRange: posTimestamp >= startTimestamp && posTimestamp <= endTimestamp
            });
            
            // Filtrar SOLO por timestamp savedAt dentro del rango
            if (posTimestamp >= startTimestamp && posTimestamp <= endTimestamp) {
              allPositions.push({
                lat: pos.latitude,
                lng: pos.longitude,
                savedAt: posTimestamp,
                accuracy: pos.accuracy || 0,
                // Mantener campos originales para compatibilidad
                latitude: pos.latitude,
                longitude: pos.longitude,
                timestamp: posTimestamp
              });
              
              console.log(`[Firebase] ✅ Posición incluida:`, {
                lat: pos.latitude,
                lng: pos.longitude,
                savedAt: posTimestamp,
                date: new Date(posTimestamp).toISOString()
              });
            }
          });
        } catch (dateError) {
          console.warn(`[Firebase] ⚠️ Error procesando fecha ${dateKey}:`, dateError);
        }
      });

      // Ordenar por timestamp
      allPositions.sort((a, b) => a.savedAt - b.savedAt);
      
      console.log(`[Firebase] ✅ Posiciones filtradas: ${allPositions.length}`);
      if (allPositions.length > 0) {
        console.log(`[Firebase] 📊 Rango de timestamps encontrado:`, {
          primera: new Date(allPositions[0].savedAt).toISOString(),
          ultima: new Date(allPositions[allPositions.length - 1].savedAt).toISOString()
        });
        console.log(`[Firebase] 📍 Primera posición:`, allPositions[0]);
        console.log(`[Firebase] 📍 Última posición:`, allPositions[allPositions.length - 1]);
      } else {
        console.log(`[Firebase] ⚠️ No se encontraron posiciones en el rango de timestamps especificado`);
      }
      
      return allPositions;
    } catch (err) {
      console.error(`[Firebase] ❌ Error cargando histórico por rango de ${userId}:`, err);
      throw err;
    }
  }, []);

  const loadUserHistory = useCallback(async (userId, date) => {
    try {
      console.log(`[Firebase] 📈 Cargando histórico de ${userId} para fecha ${date}`);
      console.log(`[Firebase] 🔗 Ruta completa: users/${userId}/history/${date}/positions`);
      
      const historyRef = ref(db, `users/${userId}/history/${date}/positions`);
      const snapshot = await get(historyRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(`[Firebase] 📊 Datos en Firebase:`, data);
        
        // Convertir el objeto a array de coordenadas
        const positions = Object.values(data).map(pos => ({
          lat: pos.latitude,
          lng: pos.longitude,
          timestamp: pos.savedAt || pos.timestamp || Date.now(),
          accuracy: pos.accuracy || 0
        }));
        
        // Ordenar por timestamp
        positions.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`[Firebase] ✅ Posiciones cargadas para ${date}:`, positions.length);
        return positions;
      } else {
        console.log(`[Firebase] ⚠️ No hay datos para ${userId} en fecha ${date}`);
        return [];
      }
    } catch (err) {
      console.error(`[Firebase] ❌ Error cargando histórico de ${userId}:`, err);
      throw err;
    }
  }, []);

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      Object.keys(listenersRef.current).forEach(userId => {
        stopWatchingUser(userId);
      });
    };
  }, [stopWatchingUser]);

  // Función para obtener posición actual y configurar tracking en vivo
  const startLiveTracking = useCallback(async (userId) => {
    try {
      console.log(`[Firebase] 🚀 Iniciando live tracking para ${userId}`);
      
      // 1️⃣ Obtener posición actual
      const currentPosRef = ref(db, `users/${userId}/currentPosition`);
      const snapshot = await get(currentPosRef);
      
      if (!snapshot.exists()) {
        console.log(`[Firebase] ⚠️ No hay posición actual para ${userId}`);
        return { success: false, error: 'No hay posición actual' };
      }

      const currentPos = snapshot.val();
      console.log(`[Firebase] 📍 Posición actual de ${userId}:`, currentPos);
      
      // Formatear posición para el mapa (igual que en histórico)
      const position = {
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        accuracy: currentPos.accuracy || 0,
        timestamp: currentPos.timestamp || Date.now()
      };

      // 2️⃣ Configurar listener para actualizaciones en tiempo real
      const liveListener = onValue(currentPosRef, (snapshot) => {
        if (snapshot.exists()) {
          const pos = snapshot.val();
          console.log(`[Firebase] 🔄 Nueva posición para ${userId}:`, pos);
          // El listener se manejará en el componente
        }
      });

      // Guardar listener
      listenersRef.current[`live_${userId}`] = liveListener;

      return { 
        success: true, 
        position: position,
        listener: liveListener
      };
      
    } catch (error) {
      console.error(`[Firebase] ❌ Error en live tracking para ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }, []);

  // Función para detener live tracking
  const stopLiveTracking = useCallback((userId) => {
    const listenerKey = `live_${userId}`;
    
    if (listenersRef.current[listenerKey]) {
      console.log(`[Firebase] 🛑 Deteniendo live tracking para ${userId}`);
      const currentPosRef = ref(db, `users/${userId}/currentPosition`);
      off(currentPosRef, 'value', listenersRef.current[listenerKey]);
      delete listenersRef.current[listenerKey];
    }
  }, []);

  // Función para eliminar todos los datos de Firebase
  const deleteAllData = useCallback(async () => {
    try {
      console.log('[Firebase] 🗑️ Eliminando todos los datos...');
      
      // Eliminar todos los usuarios
      const usersRef = ref(db, 'users');
      await remove(usersRef);
      
      console.log('[Firebase] ✅ Todos los datos eliminados exitosamente');
      
      // Limpiar estado local
      setUsers([]);
      
      // Limpiar todos los listeners activos
      Object.values(listenersRef.current).forEach(listener => {
        if (typeof listener === 'function') {
          try {
            listener();
          } catch (error) {
            console.error('[Firebase] Error limpiando listener:', error);
          }
        }
      });
      listenersRef.current = {};
      
      return { success: true };
    } catch (error) {
      console.error('[Firebase] ❌ Error eliminando datos:', error);
      setError(`Error eliminando datos: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
    watchUserPosition,
    stopWatchingUser,
    loadUserHistory,
    loadUserHistoryByRange,
    startLiveTracking,
    stopLiveTracking,
    getCurrentPosition,
    deleteAllData
  };
};

export default useFirebaseUsers;
