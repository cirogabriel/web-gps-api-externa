import { useState, useEffect } from "react"
import { Card } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "./components/ui/modal"
import { MapPin, Navigation, Clock, Satellite, Settings, User, Menu, Search, Layers, Route, Wifi, Globe, Users, Share2, Copy } from "lucide-react"
import FirebaseMapComponent from "./components/FirebaseMapComponent"
import ModeSelector from "./components/ModeSelector"
import FirebaseUsersList from "./components/FirebaseUsersList"
import { usePWAGPS } from "./hooks/usePWAGPS"

export default function GPSTracker() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  const [appMode, setAppMode] = useState(null) // null, 'watcher'
  
  // Estados para Firebase
  const [watchedUsers, setWatchedUsers] = useState({})
  const [userTrajectories, setUserTrajectories] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Hook para GPS PWA que bypassea restricciones HTTP
  const { location: localLocation, error, loading, getCurrentPosition } = usePWAGPS()
  
  // Función para observar múltiples usuarios
  const handleWatchUsers = (userId, position) => {
    if (userId && position) {
      setWatchedUsers(prev => ({
        ...prev,
        [userId]: {
          position,
          timestamp: Date.now()
        }
      }))
      setSelectedUser(userId)
    }
  }

  // Función para detener observación de un usuario
  const handleStopWatching = (userId) => {
    setWatchedUsers(prev => {
      const newWatchedUsers = { ...prev }
      delete newWatchedUsers[userId]
      return newWatchedUsers
    })
    
    if (selectedUser === userId) {
      setSelectedUser(null)
    }
  }

  // Función para mostrar histórico
  const handleShowHistory = (userId, trajectoryData) => {
    setUserTrajectories(prev => ({
      ...prev,
      [userId]: trajectoryData
    }))
    setSelectedUser(userId)
  }
  // Ubicación a mostrar (solo local para centrar el mapa)
  const location = localLocation
  
  // Ubicación por defecto si no hay ninguna disponible
  const defaultLocation = {
    latitude: -13.5409742, // Cusco, Perú
    longitude: -71.9842674,
    accuracy: 100,
    timestamp: Date.now(),
    source: 'default'
  }
  
  const finalLocation = location || defaultLocation
  
  // Debug logging
  useEffect(() => {
    console.log('[App] 🔄 Estado actual:', {
      appMode,
      finalLocation: finalLocation ? 'SÍ' : 'NO',
      localLocation: localLocation ? 'SÍ' : 'NO',
      watchedUsersCount: Object.keys(watchedUsers).length
    });
  }, [appMode, finalLocation, localLocation, watchedUsers])

  // Manejar cambio de modo
  const handleModeSelect = async (mode) => {
    setAppMode(mode)
    if (mode === 'watcher') {
      console.log("[App] Modo Observador Firebase seleccionado")
      
      // Obtener ubicación GPS para centrar el mapa si no la tenemos
      if (!localLocation) {
        console.log('[App] 🗺️ Obteniendo ubicación para centrar mapa')
        try {
          await getCurrentPosition()
        } catch (error) {
          console.warn('[App] No se pudo obtener ubicación GPS:', error)
        }
      }
    }
  }

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`
      window.open(url, "_blank")
    }
  }

  useEffect(() => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Sidebar Content Container with relative positioning */}
        <div className="relative h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              {appMode === 'tracker' ? (
                <Share2 className="w-5 h-5 text-blue-600" />
              ) : appMode === 'watcher' ? (
                <Users className="w-5 h-5 text-green-600" />
              ) : (
                <Satellite className="w-5 h-5 text-black" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">GPS Tracker</h1>
              <p className="text-xs text-gray-600">
                {appMode === 'tracker' ? 'Compartiendo ubicación' : 
                 appMode === 'watcher' ? 'Observando usuarios' : 
                 'Selecciona modo'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Selector de modo */}
        {!appMode && <ModeSelector onModeSelect={handleModeSelect} currentMode={appMode} />}

        {/* Lista de usuarios Firebase (modo observador) */}
        {appMode === 'watcher' && (
          <FirebaseUsersList 
            onWatchUser={handleWatchUsers}
            onStopWatching={handleStopWatching}
            onShowHistory={handleShowHistory}
          />
        )}

        {/* Controles de observación */}
        {appMode === 'watcher' && (
          <div className="p-4">
            <Card className="p-4 bg-white border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    Object.keys(watchedUsers).length > 0 
                      ? "bg-green-500" 
                      : "bg-gray-400"
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {Object.keys(watchedUsers).length > 0 
                      ? `Observando ${Object.keys(watchedUsers).length} usuario${Object.keys(watchedUsers).length > 1 ? 's' : ''}`
                      : "Firebase - Sin usuarios activos"
                    }
                  </span>
                </div>
                <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${
                  Object.keys(watchedUsers).length > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}>
                  {Object.keys(watchedUsers).length > 0 ? "OBSERVANDO" : "ESPERANDO"}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Conectado a Firebase Realtime Database
              </div>
            </Card>
          </div>
        )}

        {/* Author Button - Circular button at bottom left corner */}
        <div className="absolute bottom-4 left-4">
          <Button
            onClick={() => setAuthorModalOpen(true)}
            size="icon"
              className="w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 text-black shadow-lg"
            >
              <User className="w-5 h-5 text-black" />
            </Button>
          </div>

        {/* Location Details */}
        {location && (
          <div className="p-4 space-y-4">
            <Card className="p-4 bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-black" />
                <h3 className="text-sm font-semibold text-gray-900">Ubicación Actual</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <p className="text-gray-600">Coordenadas</p>
                    <p className="font-mono text-gray-900">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  {/* Información de la fuente de ubicación */}
                  <div>
                    <p className="text-gray-600">Fuente</p>
                    <div className="flex items-center gap-1">
                      <Satellite className="w-3 h-3 text-green-600" />
                      <p className="text-green-600 text-xs">GPS del dispositivo</p>
                    </div>
                  </div>
                  
                  {/* Mostrar información de ciudad si está disponible */}
                  {location.city && (
                    <div>
                      <p className="text-gray-600">Ubicación</p>
                      <p className="text-gray-900 text-xs">{location.city}, {location.region}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-600">Precisión</p>
                      <p className="text-gray-900">{Math.round(location.accuracy)}m</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Velocidad</p>
                      <p className="text-gray-900">{location.speed ? Math.round(location.speed * 3.6) : 0} km/h</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Última actualización</p>
                  <p className="flex items-center gap-1 text-gray-900">
                    <Clock className="w-3 h-3" />
                    {new Date(location.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <Button
                onClick={openInGoogleMaps}
                className="w-full mt-3 text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2"
              >
                <MapPin className="w-3 h-3 mr-2" />
                Ver en Google Maps
              </Button>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Card 
                className="p-3 bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                onClick={() => setAuthorModalOpen(true)}
              >
                <div className="text-center">
                  <User className="w-5 h-5 text-black mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Autor</p>
                </div>
              </Card>
              <Card className="p-3 bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                <div className="text-center">
                  <Clock className="w-5 h-5 text-black mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Historial</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4">
            <Card className="p-3 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-900">Aviso</h3>
              </div>
              <p className="text-xs text-orange-800">{error}</p>
            </Card>
          </div>
        )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top Bar - Mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-100">
              <Satellite className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-sm text-gray-900">GPS Tracker</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon">
              <Layers className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Desktop Top Controls */}
        <div className="hidden lg:flex items-center justify-between p-4 bg-white/80 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Layers className="w-4 h-4 mr-2" />
              Capas
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setAuthorModalOpen(true)}
            >
              <User className="w-4 h-4 mr-2" />
              Autor
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100">
          {finalLocation ? (
            <FirebaseMapComponent 
              location={finalLocation} 
              watchedUsers={watchedUsers}
              trajectories={userTrajectories}
              mode={appMode || 'observer'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          )}

          {/* Floating Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <Button size="icon" className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-lg text-gray-700">
              <Navigation className="w-4 h-4" />
            </Button>
            <Button size="icon" className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-lg text-gray-700">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Author Modal */}
      <Modal isOpen={authorModalOpen} onClose={() => setAuthorModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Información del Autor</ModalTitle>
        </ModalHeader>
        
        <ModalContent>
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-black" />
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Nombre:</span>
                <span className="text-gray-900">Ciro Gabriel Callapiña Castilla</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Número:</span>
                <span className="text-gray-900">5</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Curso:</span>
                <span className="text-gray-900">Sistemas Embebidos</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-600">Docente:</span>
                <span className="text-gray-900">José Mauro Pillco Quispe</span>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                Aplicación GPS Tracker desarrollada como proyecto de Sistemas Embebidos
              </p>
            </div>
          </div>
        </ModalContent>
        
        <ModalFooter>
          <Button 
            onClick={() => setAuthorModalOpen(false)}
            className="bg-black text-white hover:bg-gray-800"
          >
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
