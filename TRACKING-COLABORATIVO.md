# Sistema de Tracking Colaborativo - Guía Rápida

## ¿Cómo funciona?

Tu aplicación ahora tiene **dos modos** de funcionamiento que permiten el tracking colaborativo en tiempo real:

### 🔵 Modo Tracker (Ser Rastreado)
- **Qué hace**: Comparte tu ubicación en tiempo real
- **Para quién**: La persona que se mueve (ej: con el celular)
- **Cómo funciona**: Obtiene tu GPS y lo envía a Firebase cada vez que cambia

### 🟢 Modo Observador (Observar Ubicación)
- **Qué hace**: Ve la ubicación de otros usuarios en tiempo real
- **Para quién**: La persona que monitorea (ej: en la computadora)
- **Cómo funciona**: Recibe actualizaciones en vivo de usuarios activos

## Configuración Rápida (Sin Firebase propio)

La aplicación funciona **inmediatamente** con una configuración de demostración. No necesitas configurar Firebase inicialmente.

### Prueba Local:
1. Abrir dos ventanas del navegador
2. En una ventana: Seleccionar "Ser Rastreado" → Iniciar
3. En otra ventana: Seleccionar "Observar Ubicación" → Elegir usuario
4. ¡Ver ubicación en tiempo real!

## Configuración con Firebase Real (Recomendado para producción)

### Paso 1: Crear Proyecto Firebase
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto
3. Habilitar **Realtime Database**
4. Configurar reglas públicas (para pruebas):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Paso 2: Obtener Configuración
1. Ir a Configuración del proyecto → General
2. Crear app web
3. Copiar la configuración de Firebase

### Paso 3: Configurar Variables de Entorno
Crear archivo `.env`:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Uso Práctico

### Escenario: Tracking de Delivery
1. **Repartidor** (celular): Selecciona "Ser Rastreado" → Inicia sharing
2. **Cliente** (computadora): Selecciona "Observar Ubicación" → Ve al repartidor moviéndose
3. **Tiempo real**: El mapa se actualiza automáticamente

### Escenario: Monitoreo Familiar
1. **Hijo** (celular): Comparte ubicación al salir
2. **Padre** (computadora): Observa el recorrido en tiempo real
3. **Tranquilidad**: Ve cuando llega a destino

## Funcionalidades Avanzadas

### IDs de Usuario
- Cada tracker genera un ID único
- Se puede copiar y compartir
- Permite identificación específica

### Múltiples Usuarios
- Un observador puede ver varios trackers
- Lista de usuarios activos
- Selección individual

### Datos Mostrados
- Coordenadas exactas
- Precisión del GPS/IP
- Última actualización
- Estado (activo/inactivo)
- Información de ciudad

## Beneficios vs Competencia

✅ **Sin servidor propio**: Usa Firebase (infraestructura de Google)
✅ **Tiempo real**: Actualizaciones instantáneas con WebSockets
✅ **HTTP compatible**: Funciona sin HTTPS (EC2 básico)
✅ **Fácil deployment**: Solo archivos estáticos + Firebase
✅ **Escalable**: Firebase maneja miles de usuarios
✅ **Gratis**: Plan gratuito generoso

## Estructura de Datos (Firebase)

```javascript
// Realtime Database
{
  "users": {
    "user_id_123": {
      "name": "Usuario GPS",
      "isActive": true,
      "lastSeen": 1694558400000,
      "currentLocation": { ... }
    }
  },
  "locations": {
    "user_id_123": {
      "latitude": -34.6037,
      "longitude": -58.3816,
      "accuracy": 10,
      "timestamp": 1694558400000,
      "source": "navigator"
    }
  }
}
```

Esta es exactamente la solución que tus compañeros implementaron: un sistema donde una persona comparte su ubicación y otros la pueden ver en tiempo real desde sus computadoras!
