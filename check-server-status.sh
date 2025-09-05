#!/bin/bash

# Script para verificar el estado del servidor GPS en EC2

EC2_KEY="aws-web-server-ssh.pem"
EC2_USER="ubuntu"
EC2_IP="ec2-18-217-39-1.us-east-2.compute.amazonaws.com"

echo "🔍 VERIFICANDO ESTADO DEL SERVIDOR GPS"
echo "======================================"

ssh -i "$EC2_KEY" "$EC2_USER@$EC2_IP" << 'EOF'

echo "🌐 IP Pública:"
curl -s ifconfig.me
echo ""

echo "📊 Estado de nginx:"
sudo systemctl status nginx --no-pager | head -10

echo ""
echo "🔌 Puertos activos:"
sudo netstat -tulnp | grep :80

echo ""
echo "📁 Contenido del directorio web:"
ls -la /var/www/html/gps-tracker/ | head -10

echo ""
echo "📝 Últimas líneas del log de error:"
sudo tail -5 /var/log/nginx/gps-tracker-error.log 2>/dev/null || echo "No hay errores recientes"

echo ""
echo "📈 Últimas líneas del log de acceso:"
sudo tail -5 /var/log/nginx/gps-tracker-access.log 2>/dev/null || echo "No hay accesos recientes"

echo ""
echo "⚙️ Configuración nginx GPS:"
sudo nginx -t

EOF

echo ""
echo "✅ Verificación completada"
echo "🌐 Acceder a: http://$EC2_IP"
