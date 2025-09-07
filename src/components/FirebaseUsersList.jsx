import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { User, MapPin, Clock, Eye, EyeOff, History, Play, Square } from 'lucide-react';
import useFirebaseUsers from '../hooks/useFirebaseUsers';
import { getUserColor, getUserColorLight } from '../utils/userColors';

export default function FirebaseUsersList({ onWatchUser, onStopWatching, onShowHistory }) {
  const { users, loading, error, loadUsers, watchUser, stopWatchingUser, loadUserHistory } = useFirebaseUsers();
  const [liveWatching, setLiveWatching] = useState(new Set());
  const [userPositions, setUserPositions] = useState({});

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
    
    // Recargar cada 30 segundos para verificar usuarios activos
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  // Función para iniciar seguimiento en vivo
  const handleStartLiveTracking = (userId) => {
    const unsubscribe = watchUser(userId, (data) => {
      setUserPositions(prev => ({
        ...prev,
        [userId]: data.position
      }));
      
      // Notificar al componente padre para actualizar el mapa
      onWatchUser(userId, data.position);
    });

    setLiveWatching(prev => new Set([...prev, userId]));
    
    // Guardar función de cleanup para este usuario
    return unsubscribe;
  };

  // Función para detener seguimiento en vivo
  const handleStopLiveTracking = (userId) => {
    stopWatchingUser(userId);
    setLiveWatching(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    
    // Remover posición del estado
    setUserPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[userId];
      return newPositions;
    });

    onStopWatching(userId);
  };

  // Función para mostrar histórico
  const handleShowHistory = async (userId) => {
    try {
      console.log('[FirebaseUsersList] 📈 Cargando histórico REAL para:', userId);
      
      // DEBUG: Mostrar información detallada de la fecha
      const now = new Date();
      console.log('[FirebaseUsersList] 🕐 Fecha/hora actual completa:', now);
      console.log('[FirebaseUsersList] 🕐 Timestamp:', now.getTime());
      console.log('[FirebaseUsersList] 🕐 toISOString():', now.toISOString());
      console.log('[FirebaseUsersList] 🕐 getFullYear():', now.getFullYear());
      console.log('[FirebaseUsersList] 🕐 getMonth()+1:', now.getMonth() + 1);
      console.log('[FirebaseUsersList] 🕐 getDate():', now.getDate());
      
      // Usar la fecha actual dinámicamente (forzando zona horaria local)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const targetDate = `${year}-${month}-${day}`;
      
      console.log('[FirebaseUsersList] 📅 Fecha objetivo (hoy):', targetDate);
      console.log('[FirebaseUsersList] 🕐 Fecha completa actual:', today.toString());
      
      // Comparar con el método ISO
      const isoDate = today.toISOString().split('T')[0];
      console.log('[FirebaseUsersList] 📅 Fecha ISO para comparar:', isoDate);
      
      const history = await loadUserHistory(userId, targetDate);
      console.log('[FirebaseUsersList] 📊 Histórico REAL cargado de Firebase:', history);
      
      if (history && history.length > 0) {
        console.log('[FirebaseUsersList] ✅ Enviando histórico REAL al mapa');
        onShowHistory(userId, history);
      } else {
        console.log('[FirebaseUsersList] ⚠️ No se encontró histórico para la fecha objetivo');
        alert(`No se encontró histórico para ${userId} en la fecha ${targetDate}.`);
      }
    } catch (err) {
      console.error('[FirebaseUsersList] ❌ Error cargando histórico:', err);
      alert(`Error al cargar el histórico: ${err.message}`);
    }
  };

  // Función para verificar si un usuario está activo (menos de 1 minuto)
  const isUserActive = (user) => {
    const currentTime = Date.now();
    const lastUpdate = user.currentPosition?.timestamp || user.lastSeen;
    return lastUpdate && (currentTime - lastUpdate) < (1 * 60 * 1000); // 1 minuto
  };

  // Función para obtener el tiempo transcurrido
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Desconocido';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Hace unos segundos';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    return `Hace ${Math.floor(seconds / 86400)}d`;
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-4">
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando usuarios...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-600">Error: {error}</p>
            <Button 
              onClick={loadUsers} 
              size="sm" 
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4">
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-center">
            <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Sin usuarios disponibles</h3>
            <p className="text-xs text-gray-500">
              No hay usuarios compartiendo ubicación en Firebase
            </p>
            <Button 
              onClick={loadUsers} 
              size="sm" 
              variant="ghost" 
              className="mt-2 text-blue-600"
            >
              Actualizar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Usuarios Disponibles ({users.length})
        </h3>
        <div className="flex gap-2">
          {liveWatching.size > 0 && (
            <Button
              onClick={() => {
                liveWatching.forEach(userId => handleStopLiveTracking(userId));
              }}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
            >
              <Square className="w-3 h-3 mr-1" />
              Detener todo
            </Button>
          )}
          <Button
            onClick={loadUsers}
            size="sm"
            variant="ghost"
            className="text-blue-600 hover:text-blue-700"
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {users
          .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
          .map((user) => {
            const isWatching = liveWatching.has(user.id);
            const isActive = isUserActive(user);
            const timeAgo = getTimeAgo(user.currentPosition?.timestamp || user.lastSeen);
            const currentPos = userPositions[user.id] || user.currentPosition;
            const userColor = getUserColor(user.id);
            const userColorLight = getUserColorLight(user.id);

            return (
              <Card 
                key={user.id}
                className={`p-3 transition-all border-l-4`}
                style={{ 
                  borderLeftColor: userColor,
                  backgroundColor: isWatching ? userColorLight : 'white'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: userColorLight }}
                      >
                        <User 
                          className="w-4 h-4" 
                          style={{ color: userColor }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.id}
                        </p>
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: userColor }}
                          title={`Color del usuario: ${userColor}`}
                        />
                        <Badge className={`text-xs px-2 py-0.5 ${
                          isActive 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo}</span>
                        </div>
                        
                        {currentPos && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {currentPos.latitude?.toFixed(4)}, {currentPos.longitude?.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {/* Botón Seguir en vivo / Detener */}
                    <Button
                      onClick={() => {
                        if (isWatching) {
                          handleStopLiveTracking(user.id);
                        } else {
                          handleStartLiveTracking(user.id);
                        }
                      }}
                      disabled={!isActive && !isWatching}
                      size="sm"
                      className={`text-xs px-2 py-1 ${
                        isWatching
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : isActive
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isWatching ? (
                        <>
                          <Square className="w-3 h-3 mr-1" />
                          Detener
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          {isActive ? 'Seguir en vivo' : 'Inactivo'}
                        </>
                      )}
                    </Button>

                    {/* Botón Ver histórico */}
                    <Button
                      onClick={() => handleShowHistory(user.id)}
                      disabled={!user.currentPosition}
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <History className="w-3 h-3 mr-1" />
                      Histórico
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
