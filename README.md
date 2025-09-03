# GPS Tracker - Seguimiento en Tiempo Real

Una aplicación web moderna para el seguimiento GPS en tiempo real utilizando React + Vite y Google Maps API. **¡Funciona tanto con HTTP como HTTPS!**

## 🚀 Características

- **Seguimiento GPS híbrido** - Usa GPS del dispositivo cuando está disponible, geolocalización por IP como fallback
- **Compatible con HTTP/HTTPS** - Funciona en deployments sin certificado SSL
- **Seguimiento en tiempo real** - Obtiene y muestra la ubicación actual del dispositivo
- **Interfaz moderna** - Diseño limpio con colores claros y información de fuente
- **Responsive** - Funciona perfectamente en dispositivos móviles y desktop
- **Google Maps Integration** - Integración con Google Maps API
- **Información detallada** - Muestra coordenadas, precisión, velocidad, fuente de datos y más
- **Control de seguimiento** - Inicio/parada del seguimiento con un solo clic
- **APIs múltiples** - Usa múltiples proveedores de geolocalización para mayor confiabilidad

## 🌐 Compatibilidad HTTP/HTTPS

### HTTPS (Sitios seguros)
- Usa la API de geolocalización del navegador
- Alta precisión (GPS del dispositivo)
- Seguimiento en tiempo real
- Velocidad y dirección disponibles

### HTTP (Deployments sin SSL como EC2)
- Usa geolocalización por IP automáticamente
- Precisión aproximada (nivel de ciudad)
- Actualizaciones cada 30 segundos
- Compatible con servidores simples

## 🛠️ Tecnologías Utilizadas

- **React 19** - Biblioteca de JavaScript para interfaces de usuario
- **Vite** - Herramienta de desarrollo rápida
- **Tailwind CSS** - Framework CSS utilitario
- **Lucide React** - Iconos modernos
- **Geolocation API** - API nativa para obtener ubicación
- **Google Maps API** - Para mostrar mapas interactivos
- **APIs de Geolocalización Externa** - IPinfo, ipapi.co para fallback HTTP

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd web-gps
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y añade tu API key de Google Maps:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🔧 Configuración de Google Maps

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Maps
4. Crea una API key
5. Configura las restricciones de la API key para mayor seguridad
6. Añade la API key al archivo `.env`

## 📱 Uso

1. **Abrir la aplicación** - Accede a la aplicación desde tu navegador
2. **Permitir ubicación** - Autoriza el acceso a la ubicación cuando se te solicite
3. **Iniciar seguimiento** - Presiona el botón "Iniciar" para comenzar el seguimiento
4. **Ver información** - Observa los datos de ubicación en tiempo real
5. **Abrir en Maps** - Usa el botón "Ver en Google Maps" para abrir la ubicación

## 📂 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI base (Button, Card, Badge)
│   ├── LocationInfo.jsx # Información de ubicación
│   ├── TrackingControl.jsx # Control de seguimiento
│   └── MapComponent.jsx # Componente del mapa
├── hooks/              # Custom hooks
│   └── useGeolocation.js # Hook para geolocalización
├── lib/                # Utilidades
│   └── utils.js        # Funciones auxiliares
├── App.jsx             # Componente principal
├── main.jsx           # Punto de entrada
└── index.css          # Estilos globales
```

## 🎨 Personalización

### Colores

Los colores están definidos en `src/index.css` usando variables CSS:

- **Background**: Tonos claros (#f8f9fa)
- **Cards**: Blanco puro (#ffffff)  
- **Text**: Gris oscuro (#1a1a1a)
- **Accent**: Dorado (#d4af37)
- **Buttons**: Negros con texto blanco

### Componentes

Todos los componentes UI están en `src/components/ui/` y pueden ser personalizados fácilmente.

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
npm run build
npm run preview
```

### Deploy en EC2/Servidores HTTP
Esta aplicación está optimizada para funcionar en servidores HTTP simples:

1. **Construye la aplicación**
   ```bash
   npm run build
   ```

2. **Copia los archivos** del directorio `dist/` a tu servidor

3. **Sirve los archivos estáticos** con cualquier servidor web:
   ```bash
   # Con Python
   python -m http.server 3000
   
   # Con Node.js
   npx serve -s dist -p 3000
   
   # Con nginx o Apache
   # Simplemente apunta el documento root a la carpeta dist/
   ```

4. **Accede a tu aplicación** - Funciona perfectamente con `http://tu-ip-publica:3000`

### Netlify/Vercel (HTTPS automático)
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Despliega automáticamente

## 🔒 Seguridad y APIs

### Variables de Entorno Opcionales
```env
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
VITE_IPINFO_TOKEN=tu_token_ipinfo_opcional
```

### APIs Utilizadas
- **Navegador (HTTPS)**: API de Geolocalización nativa
- **IP Geolocation (HTTP/HTTPS)**: ipapi.co (gratuita) + ipinfo.io (fallback)
- **Google Maps**: Para visualización de mapas

## 🐛 Solución de Problemas

### La ubicación no funciona en HTTP
✅ **¡Ya no es un problema!** La aplicación ahora usa geolocalización por IP como fallback.

### HTTPS vs HTTP
- **HTTPS**: Usa GPS del dispositivo (precisión de metros)
- **HTTP**: Usa geolocalización por IP (precisión de kilómetros)
- **Ambos funcionan** automáticamente sin configuración adicional

### Problemas con la API de Google Maps
- Verifica que la API key esté correctamente configurada
- Asegúrate de que la API esté habilitada en Google Cloud Console
- Revisa las restricciones de la API key

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes preguntas o necesitas ayuda, por favor abre un issue en el repositorio.

---

**Desarrollado con ❤️ usando React + Vite**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
