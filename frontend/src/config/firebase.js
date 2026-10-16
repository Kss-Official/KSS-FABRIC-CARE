import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyFakeKeyForEmulatorUsageOnly12345'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fabricare-demo.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'fabricare-demo'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'fabricare-demo.appspot.com'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '952254325643'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:952254325643:web:f2c0cbbba37c25549c058e'),
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const isFakeApiKey = firebaseConfig.apiKey.includes('FakeKey') || firebaseConfig.apiKey.startsWith('AIzaSyFake');
const useEmulator = getEnv('VITE_USE_EMULATOR', 'false') === 'true' || isFakeApiKey;

if (useEmulator && typeof window !== 'undefined' && !window.__FIREBASE_EMULATOR_CONNECTED__) {
  window.__FIREBASE_EMULATOR_CONNECTED__ = true;
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch (err) {
    // ignore emulator error
  }
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch (err) {
    // ignore emulator error
  }
}

export const isFirebaseConfigured = true;
export const isRealApiKey = !isFakeApiKey;

export default app;
