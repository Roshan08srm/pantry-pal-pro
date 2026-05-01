import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA8SxfJjHnyLa2xu787np-T0DwkwXJw3dY",
  authDomain: "pantry-pal-f2172.firebaseapp.com",
  projectId: "pantry-pal-f2172",
  storageBucket: "pantry-pal-f2172.firebasestorage.app",
  messagingSenderId: "494929417849",
  appId: "1:494929417849:web:4d48d55833c42277c526a8",
  measurementId: "G-EN6LKLMF4R"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence in React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
