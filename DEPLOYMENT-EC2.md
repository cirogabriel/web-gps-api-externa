# Deployment en EC2 con HTTP

## Problema Original
Cuando se despliega una aplicación GPS en EC2 y se accede via HTTP (sin HTTPS), la API de geolocalización del navegador no funciona por seguridad.

## Solución Implementada
Hemos creado un sistema híbrido que:

1. **Intenta primero usar GPS del navegador** (si HTTPS está disponible)
2. **Fallback automático a geolocalización por IP** (funciona con HTTP)
3. **Múltiples APIs de respaldo** para mayor confiabilidad

## Instrucciones para EC2

### 1. Preparar la instancia EC2
```bash
# Conectar a tu instancia
ssh -i tu-key.pem ec2-user@tu-ip-publica

# Instalar Node.js si no está instalado
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar nginx (opcional, para servir archivos estáticos)
sudo yum install -y nginx
```

### 2. Subir y construir la aplicación
```bash
# En tu máquina local, construir la aplicación
npm run build

# Subir archivos a EC2
scp -i tu-key.pem -r dist/* ec2-user@tu-ip-publica:~/web-gps/

# O clonar el repo directamente en EC2
git clone https://github.com/tu-usuario/web-gps-clone.git
cd web-gps-clone
npm install
npm run build
```

### 3. Configurar el servidor
```bash
# Opción 1: Servidor simple con Node.js
npx serve -s dist -p 3000

# Opción 2: Con nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Configurar Security Groups
En la consola de AWS EC2:
- Permite tráfico HTTP en puerto 80
- Permite tráfico en puerto 3000 (si usas Node.js)
- Configurar reglas de entrada apropiadas

### 5. Acceso
Tu aplicación estará disponible en:
- `http://tu-ip-publica` (si usas nginx)
- `http://tu-ip-publica:3000` (si usas Node.js)

## Funcionalidades Específicas para HTTP

### Geolocalización por IP
- **Precisión**: Nivel de ciudad/región (±10km aproximadamente)
- **Velocidad**: Actualizaciones cada 30 segundos
- **Sin permisos requeridos**: Funciona automáticamente
- **APIs usadas**: ipapi.co (gratuita) + ipinfo.io (fallback)

### Indicadores visuales
- 🛰️ Verde: GPS del dispositivo (HTTPS)
- 🌐 Naranja: Geolocalización por IP (HTTP)
- 📶 Gris: Sin ubicación disponible

### Botones adicionales
- **"Obtener Ubicación"**: Para ubicación manual
- **"Iniciar"**: Para seguimiento continuo
- **"Ver en Google Maps"**: Abre ubicación en Maps (funciona siempre)

## Mejores Prácticas

1. **Para máxima precisión**: Usa HTTPS con certificado SSL
2. **Para compatibilidad**: La aplicación funciona sin problemas en HTTP
3. **Para producción**: Considera usar un dominio con SSL gratuito (Let's Encrypt)
4. **Para testing**: Usa el script `deploy-http.sh` para simular localmente

## Monitoreo
- Revisa logs del navegador para ver qué método de geolocalización se está usando
- La aplicación muestra claramente la fuente de los datos de ubicación
- Los errores se muestran de forma amigable al usuario
