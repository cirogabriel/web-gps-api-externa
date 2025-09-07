// Script para verificar datos en Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyBlhNsEG3dYLr-8sJfkYY3zl4wztFqNWpY",
  authDomain: "web-gps-clone.firebaseapp.com",
  databaseURL: "https://web-gps-clone-default-rtdb.firebaseio.com",
  projectId: "web-gps-clone",
  storageBucket: "web-gps-clone.firebasestorage.app",
  messagingSenderId: "1058982513953",
  appId: "1:1058982513953:web:9cd85db9b68f3b6074b3a3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testFirebase() {
  try {
    console.log('🔍 Verificando estructura de Firebase...');
    
    // Verificar usuarios
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      console.log('✅ Usuarios encontrados:', Object.keys(users));
      
      // Verificar específicamente el usuario 'ciro'
      if (users.ciro) {
        console.log('✅ Usuario ciro encontrado');
        
        // Verificar histórico de ciro
        const historyRef = ref(db, 'users/ciro/history');
        const historySnapshot = await get(historyRef);
        
        if (historySnapshot.exists()) {
          const history = historySnapshot.val();
          console.log('✅ Histórico de ciro encontrado:', Object.keys(history));
          
          // Verificar fecha específica
          const dateRef = ref(db, 'users/ciro/history/2025-09-06');
          const dateSnapshot = await get(dateRef);
          
          if (dateSnapshot.exists()) {
            const dateData = dateSnapshot.val();
            console.log('✅ Datos para 2025-09-06 encontrados:', dateData);
            
            // Verificar posiciones
            const positionsRef = ref(db, 'users/ciro/history/2025-09-06/positions');
            const positionsSnapshot = await get(positionsRef);
            
            if (positionsSnapshot.exists()) {
              const positions = positionsSnapshot.val();
              console.log('✅ Posiciones encontradas:', positions);
            } else {
              console.log('❌ No se encontraron posiciones');
            }
          } else {
            console.log('❌ No se encontraron datos para 2025-09-06');
          }
        } else {
          console.log('❌ No se encontró histórico para ciro');
        }
      } else {
        console.log('❌ Usuario ciro no encontrado');
      }
    } else {
      console.log('❌ No se encontraron usuarios');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFirebase();
