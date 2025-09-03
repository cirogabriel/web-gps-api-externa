#!/bin/bash

# Script para simular deployment HTTP en EC2
# Este script construye la aplicación y la sirve con un servidor HTTP simple

echo "🚀 Construyendo aplicación para deployment HTTP..."
npm run build

echo "📦 Aplicación construida en ./dist/"

echo "🌐 Iniciando servidor HTTP (simula EC2)..."
echo "La aplicación estará disponible en http://localhost:3000"
echo "Esto simula cómo funcionaría en tu instancia EC2 con HTTP"

cd dist && python -m http.server 3000
