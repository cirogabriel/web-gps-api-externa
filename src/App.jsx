import { useState, useEffect } from "react"
import { Card } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "./components/ui/modal"
import { MapPin, Navigation, Clock, Satellite, Settings, User, Menu, Search, Layers, Route, Wifi, Globe, Users } from "lucide-react"
import FirebaseMapComponent from "./components/FirebaseMapComponent"
import FirebaseUsersList from "./components/FirebaseUsersList"
import HistoryModal from "./components/HistoryModal"
import useFirebaseUsers from "./hooks/useFirebaseUsers"

export default function GPSTracker() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorModalOpen, setAuthorModalOpen] = useState(false)
  
  // Estados para Firebase
  const [watchedUsers, setWatchedUsers] = useState({})
  const [userTrajectories, setUserTrajectories] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)

  // Estados para el modal de histórico
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Hook de Firebase
  const { loadUserHistoryByRange } = useFirebaseUsers();

  // Datos de demostración iniciales que se cargan automáticamente
  useEffect(() => {
    // Simular que estos datos "vienen de Firebase" después de un pequeño delay
    const timer = setTimeout(() => {
      const demoData = {
        'demo_user_1': {
          position: {
            latitude: -13.515234,
            longitude: -71.977856,
            accuracy: 15,
            timestamp: Date.now() - 120000 // hace 2 minutos
          },
          timestamp: Date.now() - 120000
        },
        'demo_user_2': {
          position: {
            latitude: -13.518123,
            longitude: -71.979445,
            accuracy: 20,
            timestamp: Date.now() - 300000 // hace 5 minutos
          },
          timestamp: Date.now() - 300000
        },
        'demo_user_3': {
          position: {
            latitude: -13.514891,
            longitude: -71.976234,
            accuracy: 12,
            timestamp: Date.now() - 60000 // hace 1 minuto
          },
          timestamp: Date.now() - 60000
        }
      };
      
      console.log('[App] 📍 Cargando datos de demostración:', demoData);
      setWatchedUsers(demoData);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Función para observar usuarios
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
    console.log('[App] 📈 Mostrando histórico para:', userId, 'Datos:', trajectoryData);
    
    setUserTrajectories(prev => ({
      ...prev,
      [userId]: trajectoryData
    }))
    setSelectedUser(userId)
    
    // Limpiar usuarios observados para mostrar solo el histórico
    setWatchedUsers({})
  }

  // Función de prueba para Firebase
  const testFirebaseConnection = () => {
    console.log('🔍 Verificando estructura de Firebase...');
    console.log('ℹ️ Abre la consola del navegador para ver los logs detallados de Firebase');
    console.log('ℹ️ Presiona el botón "Histórico" en la lista de usuarios para probar la carga de datos');
    alert('🔍 Test de Firebase iniciado.\n\nRevisar consola del navegador para logs detallados.\nProbar el botón "Histórico" en la lista de usuarios.');
  };

  // Funciones para el modal de histórico
  const handleOpenHistoryModal = (userId) => {
    console.log('[App] 📈 Abriendo modal de histórico para:', userId);
    setSelectedUserId(userId);
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedUserId(null);
    setHistoryLoading(false);
  };

  const handleDrawRoute = async (userId, startTimestamp, endTimestamp) => {
    try {
      setHistoryLoading(true);
      console.log('[App] 🗺️ Dibujando ruta para:', {
        userId,
        startTimestamp,
        endTimestamp,
        startDate: new Date(startTimestamp).toISOString(),
        endDate: new Date(endTimestamp).toISOString()
      });

      const positions = await loadUserHistoryByRange(userId, startTimestamp, endTimestamp);
      
      if (positions && positions.length > 0) {
        console.log('[App] ✅ Ruta cargada con', positions.length, 'posiciones');
        handleShowHistory(userId, positions);
        handleCloseHistoryModal();
      } else {
        console.log('[App] ⚠️ No se encontraron posiciones en el rango seleccionado');
        alert(`No se encontraron posiciones para ${userId} en el rango de fechas seleccionado.`);
      }
    } catch (err) {
      console.error('[App] ❌ Error cargando ruta:', err);
      alert('Error al cargar el histórico: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Ubicación por defecto para centrar el mapa (Plaza de Armas, Cusco, Perú)
  const defaultLocation = {
    latitude: -13.516667,
    longitude: -71.978771,
    accuracy: 50,
    timestamp: Date.now(),
    source: 'default'
  }
  
  // Debug logging
  useEffect(() => {
    console.log('[App] 🔄 Estado actual:', {
      watchedUsersCount: Object.keys(watchedUsers).length,
      watchedUsers: watchedUsers
    });
  }, [watchedUsers])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Content Container with relative positioning */}
        <div className="relative h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Satellite className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">GPS Firebase</h1>
              <p className="text-xs text-gray-500">Web Observer</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Lista de usuarios Firebase */}
        <FirebaseUsersList 
          onWatchUser={handleWatchUsers}
          onStopWatching={handleStopWatching}
          onShowHistory={handleShowHistory}
          onOpenHistoryModal={handleOpenHistoryModal}
        />

        {/* Controles de observación */}
        <div className="p-4">
          <Card className="p-4 bg-white border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${Object.keys(watchedUsers).length > 0 ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {Object.keys(watchedUsers).length > 0 
                      ? `Observando ${Object.keys(watchedUsers).length} usuario${Object.keys(watchedUsers).length > 1 ? 's' : ''}`
                      : "Firebase - Sin usuarios activos"
                    }
                  </span>
                </div>
                <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${Object.keys(watchedUsers).length > 0 ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                  {Object.keys(watchedUsers).length > 0 ? "OBSERVANDO" : "ESPERANDO"}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Conectado a Firebase Realtime Database
              </div>
              
              {/* Información de histórico activo */}
              {selectedUser && userTrajectories[selectedUser] && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs text-blue-700 font-medium">
                    Mostrando histórico de: {selectedUser}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {userTrajectories[selectedUser].length} puntos de recorrido
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setUserTrajectories({});
                      setSelectedUser(null);
                      // Recargar datos de demostración
                      setTimeout(() => {
                        const demoData = {
                          'demo_user_1': {
                            position: {
                              latitude: -13.515234,
                              longitude: -71.977856,
                              accuracy: 15,
                              timestamp: Date.now() - 120000
                            },
                            timestamp: Date.now() - 120000
                          },
                          'demo_user_2': {
                            position: {
                              latitude: -13.518123,
                              longitude: -71.979445,
                              accuracy: 20,
                              timestamp: Date.now() - 300000
                            },
                            timestamp: Date.now() - 300000
                          },
                          'demo_user_3': {
                            position: {
                              latitude: -13.514891,
                              longitude: -71.976234,
                              accuracy: 12,
                              timestamp: Date.now() - 60000
                            },
                            timestamp: Date.now() - 60000
                          }
                        };
                        setWatchedUsers(demoData);
                      }, 500);
                    }}
                    className="w-full mt-2 text-xs"
                  >
                    Volver a vista en tiempo real
                  </Button>
                </div>
              )}
            </Card>
          </div>

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

        {/* Test Firebase Button */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={testFirebaseConnection}
            variant="outline"
            size="sm"
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            🔍 Test Firebase
          </Button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Firebase Observer</span>
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>v2.0</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-900">Firebase Realtime</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="text-gray-600">
                <Search className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-gray-600">
                <Layers className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100">
          <FirebaseMapComponent 
            location={defaultLocation} 
            watchedUsers={watchedUsers}
            trajectories={userTrajectories}
            mode="observer"
          />

          {/* Floating Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <Button size="icon" className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-lg text-gray-700">
              <Navigation className="w-4 h-4" />
            </Button>
            <Button size="icon" className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-lg text-gray-700">
              <MapPin className="w-4 h-4" />
            </Button>
            <Button size="icon" className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-lg text-gray-700">
              <Route className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Author Modal */}
      <Modal open={authorModalOpen} onOpenChange={setAuthorModalOpen}>
        <ModalHeader>
          <ModalTitle>Información del Desarrollador</ModalTitle>
        </ModalHeader>
        
        <ModalContent>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">GPS Firebase Tracker</h2>
              <p className="text-gray-600">Aplicación de seguimiento en tiempo real</p>
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
                Aplicación GPS Tracker con Firebase desarrollada como proyecto de Sistemas Embebidos
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

      {/* Modal de histórico - Centrado en el viewport completo */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={handleCloseHistoryModal}
        onDrawRoute={handleDrawRoute}
        userId={selectedUserId}
        loading={historyLoading}
      />
    </div>
  )
}
