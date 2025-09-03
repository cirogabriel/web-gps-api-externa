import { useState, useEffect } from "react"
import { Card } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "./components/ui/modal"
import { MapPin, Navigation, Clock, Satellite, Settings, User, Menu, Search, Layers, Route, Wifi, Globe } from "lucide-react"
import GoogleMap from "./components/GoogleMap"
import { useHybridGeolocation } from "./hooks/useExternalGeolocation"

export default function GPSTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  
  // Usar el hook híbrido que funciona con HTTP y HTTPS
  const { location, error, loading, locationSource, getCurrentPosition, startWatching, stopWatching } = useHybridGeolocation()

  const startTracking = () => {
    if (isTracking) return
    
    console.log("[GPS Tracker] Iniciando seguimiento...")
    
    // Si no hay ubicación actual, obtener una primera ubicación
    if (!location) {
      getCurrentPosition().then(() => {
        // Después de obtener la ubicación, iniciar el tracking
        startWatching()
        setIsTracking(true)
      }).catch(() => {
        // Si falla, intentar tracking de todas formas (puede funcionar con IP)
        startWatching()
        setIsTracking(true)
      })
    } else {
      // Si ya hay ubicación, iniciar tracking directamente
      startWatching()
      setIsTracking(true)
    }
  }

  const stopTracking = () => {
    console.log("[GPS Tracker] Deteniendo seguimiento...")
    stopWatching()
    setIsTracking(false)
  }

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`
      window.open(url, "_blank")
    }
  }

  useEffect(() => {
    // Cleanup function para detener el seguimiento al desmontar el componente
    return () => {
      if (isTracking) {
        stopWatching()
      }
    }
  }, [isTracking, stopWatching])

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
              <Satellite className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">GPS Tracker</h1>
              <p className="text-xs text-gray-600">Seguimiento premium</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar - Google Maps style */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ubicación..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>
        </div>

        {/* Status Card */}
        <div className="p-4">
          <Card className="p-4 bg-white border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-sm font-medium text-gray-900">{isTracking ? "Rastreando" : "Detenido"}</span>
              </div>
              <Badge
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isTracking 
                    ? "bg-black text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {isTracking ? "ACTIVO" : "INACTIVO"}
              </Badge>
            </div>

            <Button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={loading}
              className={`w-full text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50 ${
                isTracking 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-black hover:bg-gray-900 text-white"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  {isTracking ? "Detener" : "Iniciar"}
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Author Button - Circular button at bottom left corner */}
        {!isTracking && (
          <div className="absolute bottom-4 left-4">
            <Button
              onClick={() => setAuthorModalOpen(true)}
              size="icon"
              className="w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 text-black shadow-lg"
            >
              <User className="w-5 h-5 text-black" />
            </Button>
          </div>
        )}

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
                      {locationSource === 'navigator' ? (
                        <>
                          <Satellite className="w-3 h-3 text-green-600" />
                          <p className="text-green-600 text-xs">GPS del dispositivo</p>
                        </>
                      ) : locationSource === 'ip' ? (
                        <>
                          <Globe className="w-3 h-3 text-orange-600" />
                          <p className="text-orange-600 text-xs">Geolocalización por IP</p>
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3 h-3 text-gray-600" />
                          <p className="text-gray-600 text-xs">Ubicación no disponible</p>
                        </>
                      )}
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

        {/* Información cuando no hay ubicación */}
        {!location && !isTracking && (
          <div className="p-4">
            <Card className="p-4 bg-blue-50 border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Información</h3>
              </div>
              <div className="text-xs text-blue-800 space-y-2">
                <p>Esta aplicación funciona tanto con HTTPS como HTTP.</p>
                <p>• <strong>Con HTTPS:</strong> Usa GPS del dispositivo (alta precisión)</p>
                <p>• <strong>Con HTTP:</strong> Usa geolocalización por IP (precisión aproximada)</p>
                <p className="mt-3 font-medium">Haz clic en "Obtener Ubicación" para comenzar.</p>
              </div>
            </Card>
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
          <GoogleMap location={location} isTracking={isTracking} />

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
