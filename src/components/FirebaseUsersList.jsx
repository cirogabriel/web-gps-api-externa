import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Modal } from './ui/modal';
import { User, MapPin, Clock, Eye, EyeOff, History, Play, Square, Layers, RotateCcw, Maximize2, Trash2 } from 'lucide-react';
import useFirebaseUsers from '../hooks/useFirebaseUsers';
import { getUserColor, getUserColorLight } from '../utils/userColors';

export default function FirebaseUsersList({ onWatchUser, onStopWatching, onOpenHistoryModal, onFitAllUsers }) {
  const { users, loading, error, loadUsers, getCurrentPosition, deleteAllData } = useFirebaseUsers();
  const [liveWatching, setLiveWatching] = useState(new Set());
  const [historicalWatching, setHistoricalWatching] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Función para manejar la eliminación de todos los datos
  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteAllData();
      
      if (result.success) {
        console.log('[Firebase] ✅ Todos los datos eliminados exitosamente');
        
        // Limpiar estados locales
        setLiveWatching(new Set());
        setHistoricalWatching(new Set());
        
        // Cerrar modal
        setShowDeleteModal(false);
        
        // Mostrar confirmación
        alert('Todos los registros de geolocalización han sido eliminados exitosamente.');
      } else {
        console.error('[Firebase] ❌ Error eliminando datos:', result.error);
        alert(`Error eliminando datos: ${result.error}`);
      }
    } catch (error) {
      console.error('[Firebase] ❌ Error inesperado:', error);
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
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
          Usuarios ({users.length})
        </h3>
        <div className="flex gap-1">
          {(liveWatching.size > 0 || historicalWatching.size > 0) && (
            <>
              <Button
                onClick={() => onFitAllUsers && onFitAllUsers()}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                title="Vista general"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              
              {liveWatching.size > 0 && (
                <Button
                  onClick={() => {
                    liveWatching.forEach(userId => handleStopLiveTracking(userId));
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                  title="Detener todo en vivo"
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
              
              {historicalWatching.size > 0 && (
                <Button
                  onClick={() => {
                    historicalWatching.forEach(userId => handleShowHistory(userId));
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                  title="Ocultar todo histórico"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
          <Button
            onClick={loadUsers}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
            title="Actualizar"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowDeleteModal(true)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Eliminar todos los datos"
          >
            <Trash2 className="w-4 h-4" />
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
                className={`p-3 transition-all shadow-md hover:shadow-lg border border-gray-100 rounded-lg`}
                style={{ 
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

      {/* Modal de confirmación para eliminar todos los datos */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Eliminar todos los registros
              </h3>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              ¿Estás seguro de que deseas eliminar todos los registros de geolocalización de usuarios de Firebase?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Advertencia:</strong> Se eliminarán permanentemente todos los datos de usuarios, posiciones actuales e historial de ubicaciones almacenados en Firebase.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              disabled={isDeleting}
              className="px-4 py-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar todo
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}