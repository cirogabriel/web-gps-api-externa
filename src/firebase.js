import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAIQAaBx6TIznc8RIw6viKUPTyalpN6SEQ",
  authDomain: "gps-tracker-5001f.firebaseapp.com",
  databaseURL: "https://gps-tracker-5001f-default-rtdb.firebaseio.com",
  projectId: "gps-tracker-5001f",
  storageBucket: "gps-tracker-5001f.firebasestorage.app",
  messagingSenderId: "861617173263",
  appId: "1:861617173263:web:f714c17706ec0d873f047a"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
