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
  
  // Debug para el modal
  useEffect(() => {
    console.log('Estado del modal autor:', authorModalOpen);
  }, [authorModalOpen]);
  
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

  // Función para observar usuarios (SOPORTE MULTIUSUARIO)
  const handleWatchUsers = (userId, positionData, mode = 'live') => {
    console.log(`[App] 📍 Agregando usuario ${userId} en modo ${mode}:`, Array.isArray(positionData) ? `${positionData.length} posiciones` : 'Posición única');
    
    if (userId && positionData) {
      // Para modo histórico: agregar a trayectorias
      if (mode === 'historical' && Array.isArray(positionData)) {
        setUserTrajectories(prev => ({
          ...prev,
          [userId]: positionData
        }));
        console.log(`[App] 🗺️ Trayectoria histórica agregada para ${userId}`);
      }
      
      // Para modo en vivo: agregar a usuarios observados CON MODO CORRECTO
      if (mode === 'live' && !Array.isArray(positionData)) {
        setWatchedUsers(prev => ({
          ...prev,
          [userId]: {
            position: positionData,
            mode: 'live',  // 🔥 AGREGADO: Pasar el modo explícitamente
            timestamp: Date.now()
          }
        }));
        console.log(`[App] 📍 Usuario en vivo agregado con modo: ${userId}`);
      }
      
      // El último usuario activado se convierte en el seleccionado (para centrar mapa)
      setSelectedUser(userId);
      console.log(`[App] 🎯 Mapa se centrará en: ${userId}`);
    }
  }

  // Función para detener observación de un usuario (SOPORTE MULTIUSUARIO)
  const handleStopWatching = (userId, mode = 'live') => {
    console.log(`[App] 🛑 Deteniendo seguimiento de ${userId} en modo ${mode}`);
    
    // Remover de usuarios en vivo
    if (mode === 'live') {
      setWatchedUsers(prev => {
        const newWatchedUsers = { ...prev };
        delete newWatchedUsers[userId];
        return newWatchedUsers;
      });
    }
    
    // Remover de trayectorias históricas
    if (mode === 'historical') {
      setUserTrajectories(prev => {
        const newTrajectories = { ...prev };
        delete newTrajectories[userId];
        return newTrajectories;
      });
    }
    
    // Si era el usuario seleccionado, no cambiar la vista del mapa automáticamente
    // (mantener la vista actual como se requiere)
    if (selectedUser === userId) {
      console.log(`[App] 📍 Usuario ${userId} era el seleccionado, manteniendo vista actual`);
      // setSelectedUser(null); // No limpiar para mantener vista
    }
  }

  // Función para mostrar histórico (SOPORTE MULTIUSUARIO)
  const handleShowHistory = (userId, trajectoryData) => {
    console.log(`[App] 📈 Agregando histórico para ${userId}:`, trajectoryData);
    
    // Agregar trayectoria histórica sin limpiar las demás
    setUserTrajectories(prev => ({
      ...prev,
      [userId]: trajectoryData
    }));
    
    // El último usuario activado se convierte en el seleccionado (para centrar mapa)
    setSelectedUser(userId);
    console.log(`[App] 🎯 Mapa se centrará en histórico de: ${userId}`);
    
    // NO limpiar usuarios en vivo - permitir ambos modos simultáneamente
    // setWatchedUsers({}); // REMOVIDO para soporte multiusuario
  }

  // Función para ajustar vista a todos los usuarios activos
  const handleFitAllUsers = () => {
    const allActiveUsers = [
      ...Object.keys(watchedUsers),
      ...Object.keys(userTrajectories)
    ];
    const uniqueUsers = [...new Set(allActiveUsers)];
    
    console.log(`[App] 🗺️ Ajustando vista para mostrar ${uniqueUsers.length} usuarios:`, uniqueUsers);
    
    if (uniqueUsers.length > 0) {
      // Establecer un flag especial para indicar que se debe usar fitBounds
      setSelectedUser('FIT_ALL_USERS');
    }
  }
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
  };
  
  // Debug logging
  useEffect(() => {
    console.log('[App] 🔄 Estado actual:', {
      watchedUsersCount: Object.keys(watchedUsers).length,
      watchedUsers: watchedUsers
    });
  }, [watchedUsers]);

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
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Satellite className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">GPS Tracker</h1>
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
          onFitAllUsers={handleFitAllUsers}
        />

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Observer</span>
            </div>
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
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-gray-600"
                  onClick={() => {
                    console.log('Click en botón usuario detectado');
                    setAuthorModalOpen(true);
                    console.log('Modal abierto:', true);
                  }}
                >
                  <User className="w-4 h-4" />
                </Button>
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

      {/* Author Modal - Diseño tipo Red Social */}
      <Modal isOpen={authorModalOpen} onClose={() => setAuthorModalOpen(false)}>
        <ModalHeader>
          <ModalTitle className="text-center">Información del Proyecto</ModalTitle>
        </ModalHeader>
        
        <ModalContent>
          <div className="p-4">
            {/* Info Simple - No centrado */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Autor:</span>
                <span>Ciro Gabriel Callapiña Castilla</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Número:</span>
                <span>5</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Profesor:</span>
                <span>Jose Mauro Pillco Quispe</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Curso:</span>
                <span>Sistemas Embebidos</span>
              </div>
            </div>
            
            {/* Project Description */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                <Satellite className="w-4 h-4 text-blue-600" />
                GPS Tracker - Sistema de Monitoreo
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed mb-2">
                Aplicación web de seguimiento GPS en tiempo real con React y Firebase. 
                Monitoreo multiusuario y trayectorias históricas.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">React</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Firebase</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Maps</span>
              </div>
            </div>
          </div>
        </ModalContent>
        
        <ModalFooter>
          <Button 
            onClick={() => setAuthorModalOpen(false)}
            className="bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 text-sm"
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
