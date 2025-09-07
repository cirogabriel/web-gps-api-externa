import React, { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from './ui/modal';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  onDrawRoute, 
  userId, 
  loading = false 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  console.log('[HistoryModal] 🔍 Renderizando modal:', { isOpen, userId, loading });

  const handleDrawRoute = () => {
    if (!startDate || !endDate) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }

    // Convertir fechas a timestamps UTC - ajustado para incluir todo el día
    // Usar la zona horaria local para evitar problemas de conversión
    const startDateTime = new Date(startDate + "T00:00:00");
    const endDateTime = new Date(endDate + "T23:59:59");
    
    const startTimestamp = startDateTime.getTime();
    const endTimestamp = endDateTime.getTime();

    console.log('[HistoryModal] 📅 Rango seleccionado:', {
      startDate,
      endDate,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      startTimestamp,
      endTimestamp,
      userId
    });

    onDrawRoute(userId, startTimestamp, endTimestamp);
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    onClose();
  };

  // Establecer fecha máxima como hoy
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Histórico de Rutas - {userId}
        </ModalTitle>
      </ModalHeader>
      
      <ModalContent className="space-y-6">
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Selecciona el rango de fechas</span>
          </div>
          <p>Se mostrará el recorrido completo entre las fechas seleccionadas basado en los timestamps almacenados en Firebase.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={today}
              min={startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {startDate && endDate && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Rango seleccionado:</strong> {startDate} a {endDate}
              <br />
              <span className="text-green-600">
                ({Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} días)
              </span>
            </div>
          </div>
        )}
      </ModalContent>

      <ModalFooter className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleDrawRoute}
          disabled={!startDate || !endDate || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Dibujar Ruta
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default HistoryModal;
