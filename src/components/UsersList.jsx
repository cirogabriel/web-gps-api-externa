import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { User, MapPin, Clock, Eye, EyeOff } from 'lucide-react'

export default function UsersList({ users, watchedUserId, onWatchUser }) {
  // Convertir watchedUserId a array si es string, o usar array vacío
  const watchedUserIds = Array.isArray(watchedUserId) ? watchedUserId : (watchedUserId ? [watchedUserId] : [])
  
  if (!users || users.length === 0) {
    return (
      <div className="p-4">
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-center">
            <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Sin usuarios activos</h3>
            <p className="text-xs text-gray-500">
              No hay usuarios compartiendo su ubicación en este momento
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Usuarios Activos ({users.length})
        </h3>
        {watchedUserIds.length > 0 && (
          <Button
            onClick={() => onWatchUser([])}
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Detener ({watchedUserIds.length})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {users
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Más recientes arriba
          .map((user) => {
          const isWatching = watchedUserIds.includes(user.userId || user.id)
          const timeAgo = Math.floor((Date.now() - (user.timestamp || user.lastSeen || Date.now())) / 1000)
          
          return (
            <Card 
              key={user.userId || user.id}
              className={`p-3 transition-all ${
                isWatching 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${
                      isWatching ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <User className={`w-4 h-4 ${
                        isWatching ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || `Usuario ${user.userId?.slice(-6)}`}
                      </p>
                      <Badge className={`text-xs px-2 py-0.5 ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.isActive ? 'En línea' : 'Desconectado'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {timeAgo < 60 
                            ? 'Hace unos segundos' 
                            : `Hace ${Math.floor(timeAgo / 60)}m`
                          }
                        </span>
                      </div>
                      
                      {user.latitude && user.longitude && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {user.city || 'Ubicación disponible'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isWatching ? (
                    <Button
                      onClick={() => {
                        const newWatchedIds = watchedUserIds.filter(id => id !== (user.userId || user.id))
                        onWatchUser(newWatchedIds)
                      }}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5"
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      Detener
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        console.log('[UsersList] Observando usuario:', user.userId || user.id)
                        const newWatchedIds = [...watchedUserIds, user.userId || user.id]
                        onWatchUser(newWatchedIds)
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5"
                      disabled={!user.isActive}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Observar
                    </Button>
                  )}
                </div>
              </div>

              {isWatching && (user.latitude && user.longitude) && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Coordenadas:</span>
                      <p className="font-mono text-green-700 mt-1">
                        {user.latitude?.toFixed(6)}, {user.longitude?.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Precisión:</span>
                      <p className="text-green-700 mt-1">
                        {Math.round(user.accuracy || 0)}m
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
