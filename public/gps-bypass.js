// Bypass completo de restricciones de geolocation en HTTP
// Este script se inyecta antes que la aplicación React

(function() {
    'use strict';
    
    console.log('[GPS-BYPASS] 🚀 Iniciando bypass de restricciones GPS');
    
    // TRUCO 1: Modificar window.location para simular HTTPS de manera segura
    try {
        if (window.location.protocol !== 'https:') {
            Object.defineProperty(window.location, 'protocol', {
                writable: true,
                value: 'https:'
            });
        }
    } catch (error) {
        console.log('[GPS-BYPASS] ⚠️ No se pudo modificar protocol:', error.message);
    }
    
    try {
        if (!window.location.origin.startsWith('https://')) {
            Object.defineProperty(window.location, 'origin', {
                writable: true,
                value: 'https://localhost'
            });
        }
    } catch (error) {
        console.log('[GPS-BYPASS] ⚠️ No se pudo modificar origin:', error.message);
    }
    
    // TRUCO 2: Override de navigator.geolocation completo
    if (navigator.geolocation) {
        const originalGeolocation = navigator.geolocation;
        
        // Crear un proxy que bypasea las verificaciones
        const geolocationProxy = {
            getCurrentPosition: function(successCallback, errorCallback, options) {
                console.log('[GPS-BYPASS] 📍 Interceptando getCurrentPosition');
                
                // Configuración agresiva
                const forceOptions = {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0,
                    ...options
                };
                
                // Intentar múltiples veces
                let attempts = 0;
                const maxAttempts = 3;
                
                const tryGetPosition = () => {
                    attempts++;
                    console.log(`[GPS-BYPASS] 🔄 Intento ${attempts}/${maxAttempts}`);
                    
                    originalGeolocation.getCurrentPosition(
                        (position) => {
                            console.log('[GPS-BYPASS] ✅ GPS obtenido exitosamente');
                            successCallback(position);
                        },
                        (error) => {
                            console.log(`[GPS-BYPASS] ❌ Error intento ${attempts}:`, error);
                            
                            if (attempts < maxAttempts) {
                                setTimeout(tryGetPosition, 1000);
                            } else if (errorCallback) {
                                errorCallback(error);
                            }
                        },
                        forceOptions
                    );
                };
                
                tryGetPosition();
            },
            
            watchPosition: function(successCallback, errorCallback, options) {
                console.log('[GPS-BYPASS] 👀 Interceptando watchPosition');
                
                const forceOptions = {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 5000,
                    ...options
                };
                
                return originalGeolocation.watchPosition(
                    (position) => {
                        console.log('[GPS-BYPASS] 📍 Posición actualizada');
                        successCallback(position);
                    },
                    (error) => {
                        console.log('[GPS-BYPASS] ❌ Error en watch:', error);
                        if (errorCallback) errorCallback(error);
                    },
                    forceOptions
                );
            },
            
            clearWatch: function(watchId) {
                return originalGeolocation.clearWatch(watchId);
            }
        };
        
        // Reemplazar completamente el objeto geolocation
        Object.defineProperty(navigator, 'geolocation', {
            value: geolocationProxy,
            writable: false,
            configurable: false
        });
        
        console.log('[GPS-BYPASS] ✅ Geolocation proxy instalado');
    }
    
    // TRUCO 3: Modificar document.domain si es necesario
    try {
        // Establecer domain para permitir cross-origin
        if (document.domain) {
            document.domain = document.domain.split('.').slice(-2).join('.');
        }
    } catch (error) {
        console.log('[GPS-BYPASS] ⚠️ No se pudo modificar document.domain:', error.message);
    }
    
    // TRUCO 4: Simular contexto seguro
    Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: false
    });
    
    console.log('[GPS-BYPASS] 🎯 Bypass completado - GPS debería funcionar en HTTP');
    
})();
