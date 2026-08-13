import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyFakeApiKeyForAdminScaffoldingOnly",
  authDomain: "bingo-platform-prod.firebaseapp.com",
  projectId: "bingo-platform-prod",
  storageBucket: "bingo-platform-prod.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

export const app = initializeApp(firebaseConfig, "admin-app");

export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);
export const adminFunctions = getFunctions(app, 'us-central1');

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (isLocalhost) {
  connectAuthEmulator(adminAuth, 'http://localhost:9099');
  connectFirestoreEmulator(adminFirestore, 'localhost', 8080);
  connectFunctionsEmulator(adminFunctions, 'localhost', 5001);
}

