import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Smartphone, Monitor, Users, Share, Eye } from 'lucide-react'

export default function ModeSelector({ onModeSelect, currentMode }) {

  const modes = [
    {
      id: 'watcher',
      title: 'Observar Ubicaciones',
      description: 'Ver la ubicación de usuarios móviles en tiempo real desde Firebase',
      icon: Monitor,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-600'
    }
  ]

  if (currentMode) {
    return (
      <div className="p-4">
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1">
                Modo Activo
              </Badge>
            </div>
            <Button
              onClick={() => onModeSelect(null)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              Cambiar Modo
            </Button>
          </div>
          
          <div className="text-center">
            {currentMode === 'watcher' ? (
              <>
                <Monitor className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Modo Observador</h3>
                <p className="text-sm text-gray-600">Viendo ubicaciones desde Firebase</p>
              </>
            ) : null}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Observador Firebase</h2>
        </div>
        <p className="text-sm text-gray-600">
          Conecta con Firebase para ver usuarios móviles en tiempo real
        </p>
      </div>

      <div className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <Card 
              key={mode.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200"
              onClick={() => onModeSelect(mode.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Icon className={`w-5 h-5 ${mode.textColor}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{mode.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{mode.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    className={`text-white text-xs px-3 py-1.5 ${mode.color}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onModeSelect(mode.id)
                    }}
                  >
                    Seleccionar
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Share className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">¿Cómo funciona?</p>
            <p>• <strong>Tracker:</strong> Tu dispositivo comparte su ubicación</p>
            <p>• <strong>Observador:</strong> Ves la ubicación de otros usuarios</p>
            <p>• Las ubicaciones se sincronizan en tiempo real</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
