import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyBs7OqbOeIIcldEkaJQTCKw_zBF-Sa7Au0'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fabric-care-1f384.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'fabric-care-1f384'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'fabric-care-1f384.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '952254325643'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:952254325643:web:f2c0cbbba37c25549c058e'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL', 'https://fabric-care-1f384-default-rtdb.firebaseio.com/'),
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
// Alias db to rtdb
export const db = rtdb;

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
    connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
  } catch (err) {
    // ignore emulator error
  }
}

export const isFirebaseConfigured = true;
export const isRealApiKey = !isFakeApiKey;

/**
 * Creates or gets a secondary Firebase app instance to register staff/agents without signing out the admin
 */
export const getSecondaryAuth = () => {
  const secondaryAppName = 'fabricare-secondary-admin';
  const existingApp = getApps().find(a => a.name === secondaryAppName);
  const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  if (useEmulator) {
    try {
      connectAuthEmulator(secondaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch {
      // ignore emulator error
    }
  }
  return { secondaryApp, secondaryAuth };
};

export default app;
