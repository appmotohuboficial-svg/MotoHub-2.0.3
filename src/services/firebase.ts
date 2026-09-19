import { initializeApp } from 'firebase/app';
import { initializePlatformAuth } from './auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBq0VL20um53X7a9FhNP67LW-5KHQAtOoI",
  authDomain: "app-motohub-oficial.firebaseapp.com",
  projectId: "app-motohub-oficial",
  storageBucket: "app-motohub-oficial.firebasestorage.app",
  messagingSenderId: "418499398928",
  appId: "1:418499398928:android:3e931c3186eadc53202995"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços para uso no aplicativo
export const auth = initializePlatformAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
