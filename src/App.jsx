import { useState, useEffect } from "react"
import { Card } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { MapPin, Navigation, Clock, Satellite, Settings, User, Menu, Search, Layers, Route } from "lucide-react"

export default function GPSTracker() {
  const [location, setLocation] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState(null)
  const [watchId, setWatchId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada en este dispositivo")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        }
        setLocation(locationData)
        setError(null)
        console.log("[GPS Tracker] Location updated:", locationData)
      },
      (err) => {
        setError(`Error de ubicación: ${err.message}`)
        console.log("[GPS Tracker] Geolocation error:", err)
      },
      options,
    )

    setWatchId(id)
    setIsTracking(true)
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`
      window.open(url, "_blank")
    }
  }

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Satellite className="w-5 h-5 text-yellow-600" />
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
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
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
              className={`w-full text-sm font-medium rounded-lg py-2.5 transition-colors ${
                isTracking 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-black hover:bg-gray-900 text-white"
              }`}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isTracking ? "Detener" : "Iniciar"}
            </Button>
          </Card>
        </div>

        {/* Location Details */}
        {location && (
          <div className="p-4 space-y-4">
            <Card className="p-4 bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-yellow-600" />
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
              <Card className="p-3 bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                <div className="text-center">
                  <Route className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Rutas</p>
                </div>
              </Card>
              <Card className="p-3 bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                <div className="text-center">
                  <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-900">Historial</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4">
            <Card className="p-3 bg-red-50 border-red-200">
              <p className="text-xs text-red-600">{error}</p>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top Bar - Mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-100">
              <Satellite className="w-4 h-4 text-yellow-600" />
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
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Route className="w-4 h-4 mr-2" />
              Rutas
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="p-6 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 mb-4 shadow-lg">
                <MapPin className="w-12 h-12 text-yellow-600 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Mapa Interactivo</h3>
              <p className="text-gray-600 max-w-sm">
                {location
                  ? "Tu ubicación se mostrará aquí en tiempo real"
                  : "Inicia el seguimiento para ver tu ubicación en el mapa"}
              </p>
              {location && (
                <div className="mt-4 p-3 bg-gray-800 backdrop-blur-sm rounded-lg border border-gray-300 inline-block">
                  <p className="text-sm font-mono text-white">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

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
    </div>
  )
}
