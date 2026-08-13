import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyFakeApiKeyForScaffoldingOnly",
  authDomain: "bingo-platform-prod.firebaseapp.com",
  databaseURL: "https://bingo-platform-prod-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bingo-platform-prod",
  storageBucket: "bingo-platform-prod.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

const isNative = Capacitor.isNativePlatform();
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// On Android APK / Emulator, 'localhost' refers to the device itself.
// 10.0.2.2 maps to the host machine running the Firebase emulators.
const emulatorHost = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EMULATOR_HOST)
  ? import.meta.env.VITE_EMULATOR_HOST 
  : (isNative ? '10.0.2.2' : 'localhost');

if (isLocalhost || isNative) {
  // Point all Firebase services at local emulators
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectDatabaseEmulator(db, emulatorHost, 9000);
    connectFirestoreEmulator(firestore, emulatorHost, 8080);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
  } catch (err) {
    console.warn("Firebase emulator connection warning:", err);
  }
}
// App Check is skipped in emulator mode — enable only for production builds


