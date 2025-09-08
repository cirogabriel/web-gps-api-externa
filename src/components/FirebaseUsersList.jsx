import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { User, MapPin, Clock, Eye, EyeOff, History, Play, Square, Layers } from 'lucide-react';
import useFirebaseUsers from '../hooks/useFirebaseUsers';
import { getUserColor, getUserColorLight } from '../utils/userColors';

export default function FirebaseUsersList({ onWatchUser, onStopWatching, onOpenHistoryModal, onFitAllUsers }) {
  const { users, loading, error, loadUsers, getCurrentPosition } = useFirebaseUsers();
  const [liveWatching, setLiveWatching] = useState(new Set());
  const [historicalWatching, setHistoricalWatching] = useState(new Set());

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
    
    // Recargar cada 30 segundos para verificar usuarios activos
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  // Función SIMPLE para ver en vivo - obtener posición y mostrarla (MULTIUSUARIO)
  const handleStartLiveTracking = async (userId) => {
    console.log(`[Ver en Vivo] 🎯 Obteniendo posición de ${userId}...`);
    
    try {
      // 1. Obtener la posición actual de Firebase
      const position = await getCurrentPosition(userId);
      
      if (position) {
        console.log(`[Ver en Vivo] ✅ Posición obtenida:`, position);
        
        // 2. Agregar a la lista de seguimiento
        setLiveWatching(prev => new Set([...prev, userId]));
        
        // 3. Pasar al mapa indicando modo 'live' para soporte multiusuario
        if (onWatchUser) {
          onWatchUser(userId, position, 'live');
        }
        
        console.log(`[Ver en Vivo] 🗺️ Usuario ${userId} agregado al tracking en vivo`);
      } else {
        console.error(`[Ver en Vivo] ❌ No se encontró posición para ${userId}`);
        alert(`No hay posición actual disponible para ${userId}`);
      }
    } catch (error) {
      console.error(`[Ver en Vivo] ❌ Error:`, error);
      alert(`Error obteniendo posición: ${error.message}`);
    }
  };

  // Función SIMPLE para detener seguimiento (MULTIUSUARIO)
  const handleStopLiveTracking = (userId) => {
    console.log(`[Ver en Vivo] 🛑 Deteniendo seguimiento de ${userId}`);
    
    // Remover de la lista de observados
    setLiveWatching(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    
    // Notificar al componente padre para limpiar el mapa, indicando modo 'live'
    if (onStopWatching) {
      onStopWatching(userId, 'live');
    }
  };

  // Función para manejar histórico (MULTIUSUARIO)
  const handleShowHistory = (userId) => {
    const isWatchingHistorical = historicalWatching.has(userId);
    
    if (isWatchingHistorical) {
      // Dejar de ver histórico
      console.log(`[Histórico] 🛑 Ocultando histórico de ${userId}`);
      setHistoricalWatching(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      if (onStopWatching) {
        onStopWatching(userId, 'historical');
      }
    } else {
      // Mostrar histórico
      console.log(`[Histórico] 📈 Delegando apertura de modal al componente padre para: ${userId}`);
      onOpenHistoryModal(userId);
    }
  };

  // Función para cuando se carga histórico desde el modal
  const handleHistoricalLoaded = (userId) => {
    setHistoricalWatching(prev => new Set([...prev, userId]));
  };

  // Función para verificar si un usuario tiene posición actual
  const hasCurrentPosition = (user) => {
    return user.currentPosition && 
           user.currentPosition.latitude && 
           user.currentPosition.longitude;
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
          {(liveWatching.size > 0 || historicalWatching.size > 0) && (
            <>
              <Button
                onClick={() => onFitAllUsers && onFitAllUsers()}
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                <Layers className="w-3 h-3 mr-1" />
                Ajustar vista
              </Button>
              
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
                  Detener todo en vivo
                </Button>
              )}
              
              {historicalWatching.size > 0 && (
                <Button
                  onClick={() => {
                    historicalWatching.forEach(userId => handleShowHistory(userId));
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-orange-600 hover:text-orange-700"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Ocultar todo histórico
                </Button>
              )}
            </>
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
            const isWatchingHistorical = historicalWatching.has(user.id);
            const hasPosition = hasCurrentPosition(user);
            const timeAgo = getTimeAgo(user.currentPosition?.timestamp || user.lastSeen);
            const currentPos = user.currentPosition;
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
                          hasPosition 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {hasPosition ? 'Con ubicación' : 'Sin ubicación'}
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
                    {/* Botón Ver en vivo / Dejar de ver */}
                    <Button
                      onClick={() => {
                        if (isWatching) {
                          handleStopLiveTracking(user.id);
                        } else {
                          handleStartLiveTracking(user.id);
                        }
                      }}
                      disabled={!hasPosition && !isWatching}
                      size="sm"
                      className={`text-xs px-2 py-1 ${
                        isWatching
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : hasPosition
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isWatching ? (
                        <>
                          <Square className="w-3 h-3 mr-1" />
                          Dejar de ver
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Ver en vivo
                        </>
                      )}
                    </Button>

                    {/* Botón Ver histórico / Ocultar histórico */}
                    <Button
                      onClick={() => handleShowHistory(user.id)}
                      disabled={!user.currentPosition}
                      size="sm"
                      variant="outline"
                      className={`text-xs px-2 py-1 ${
                        isWatchingHistorical
                          ? 'border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <History className="w-3 h-3 mr-1" />
                      {isWatchingHistorical ? 'Ocultar histórico' : 'Ver histórico'}
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