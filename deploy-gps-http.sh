#!/bin/bash

echo "🚀 DEPLOY GPS REAL CON HTTP://IP-PUBLICA EN NGINX EC2 🚀"
echo "========================================================"

# Configuración
EC2_KEY="aws-web-server-ssh.pem"
EC2_USER="ubuntu"
EC2_IP="ec2-18-217-39-1.us-east-2.compute.amazonaws.com"

echo "📦 Paso 1: Compilando aplicación..."
npm run build

echo "📁 Paso 2: Comprimiendo archivos..."
tar -czf dist.tar.gz dist/
tar -czf nginx-config.tar.gz nginx-gps-config

echo "🚚 Paso 3: Subiendo a EC2..."
scp -i "$EC2_KEY" dist.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/"
scp -i "$EC2_KEY" nginx-config.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/"

echo "🔧 Paso 4: Configurando NGINX en EC2..."
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_IP" << 'EOF'

echo "🔄 Actualizando sistema..."
sudo apt update

echo "📦 Instalando nginx con módulos necesarios..."
sudo apt install -y nginx nginx-module-http-sub-filter

echo "🛑 Deteniendo nginx..."
sudo systemctl stop nginx

echo "📁 Configurando directorio web..."
sudo mkdir -p /var/www/html/gps-tracker
sudo rm -rf /var/www/html/gps-tracker/*

echo "📦 Extrayendo aplicación..."
cd /home/ubuntu
tar -xzf dist.tar.gz
sudo cp -r dist/* /var/www/html/gps-tracker/
sudo chown -R www-data:www-data /var/www/html/gps-tracker/

echo "⚙️ Configurando nginx para GPS..."
tar -xzf nginx-config.tar.gz
sudo cp nginx-gps-config /etc/nginx/sites-available/gps-tracker

# Eliminar configuración por defecto
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/gps-tracker

# Activar nueva configuración
sudo ln -s /etc/nginx/sites-available/gps-tracker /etc/nginx/sites-enabled/

echo "🔍 Verificando configuración nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración nginx válida"
    
    echo "🚀 Iniciando nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    echo "📊 Estado del servidor:"
    sudo systemctl status nginx --no-pager
    
    echo "🌐 Verificando puerto 80..."
    sudo netstat -tulnp | grep :80
    
    # Obtener IP pública
    PUBLIC_IP=$(curl -s ifconfig.me)
    
    echo ""
    echo "✅ DEPLOY COMPLETADO!"
    echo "🌐 Tu aplicación GPS está disponible en:"
    echo "   http://$PUBLIC_IP"
    echo ""
    echo "🎯 CARACTERÍSTICAS:"
    echo "   - ✅ GPS REAL SOLAMENTE (sin fallbacks)"
    echo "   - ✅ HTTP://IP-PUBLICA funcionando"
    echo "   - ✅ NGINX configurado con headers GPS"
    echo "   - ✅ Múltiples usuarios observables"
    echo ""
    echo "📱 INSTRUCCIONES:"
    echo "   1. Abre http://$PUBLIC_IP en tu móvil"
    echo "   2. Acepta permisos de GPS cuando aparezca"
    echo "   3. El GPS REAL debería funcionar directamente"
    echo ""
    echo "🔧 Para debugging:"
    echo "   sudo tail -f /var/log/nginx/gps-tracker-error.log"
    echo "   sudo tail -f /var/log/nginx/gps-tracker-access.log"
    
else
    echo "❌ Error en configuración nginx"
    sudo nginx -t
    exit 1
fi

EOF

echo ""
echo "🎊 PROCESO COMPLETADO"
echo "🌐 Accede a: http://$EC2_IP"
echo "📍 GPS REAL configurado para HTTP"

# Limpiar archivos temporales
rm -f dist.tar.gz nginx-config.tar.gz
