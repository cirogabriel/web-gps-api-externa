import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { User, MapPin, Clock, Eye, EyeOff } from 'lucide-react'

export default function UsersList({ users, watchedUserId, onWatchUser, onStopWatching }) {
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
        {watchedUserId && (
          <Button
            onClick={onStopWatching}
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Detener
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const isWatching = watchedUserId === user.id
          const timeAgo = Math.floor((Date.now() - user.lastSeen) / 1000)
          
          return (
            <Card 
              key={user.id}
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
                        {user.name || user.id}
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
                      
                      {user.currentLocation && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {user.currentLocation.city || 'Ubicación disponible'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isWatching ? (
                    <Button
                      onClick={onStopWatching}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5"
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      Detener
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onWatchUser(user.id)}
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

              {isWatching && user.currentLocation && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Coordenadas:</span>
                      <p className="font-mono text-green-700 mt-1">
                        {user.currentLocation.latitude?.toFixed(6)}, {user.currentLocation.longitude?.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Precisión:</span>
                      <p className="text-green-700 mt-1">
                        {Math.round(user.currentLocation.accuracy || 0)}m
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
