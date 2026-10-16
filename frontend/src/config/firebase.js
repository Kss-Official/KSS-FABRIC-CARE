import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const rawApiKey = getEnv('VITE_FIREBASE_API_KEY', '');

// Check whether a valid, genuine Firebase API key is configured (avoids firing network requests with placeholder keys)
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  typeof rawApiKey === 'string' &&
  !rawApiKey.toLowerCase().includes('placeholder') &&
  !rawApiKey.toLowerCase().includes('demo') &&
  !rawApiKey.toLowerCase().includes('your_api_key') &&
  !rawApiKey.toLowerCase().includes('fabric_care') &&
  rawApiKey.startsWith('AIzaSy') &&
  rawApiKey.length >= 35
);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fabric-care-1f384.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'fabric-care-1f384'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'fabric-care-1f384.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '952254325643'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:952254325643:web:f2c0cbbba37c25549c058e'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-G7VVZ44JH4')
};

// Initialize Firebase as a singleton instance ONLY when a genuine API key is present
export const app = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

// Initialize Firebase Authentication only when genuine Firebase app exists
export const auth = (isFirebaseConfigured && app) ? getAuth(app) : null;

// Initialize Cloud Firestore Database only when genuine Firebase app exists
export const db = (isFirebaseConfigured && app) ? getFirestore(app) : null;

let analytics = null;
if (typeof window !== 'undefined' && isFirebaseConfigured && app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics is optional and suppressed in development/unsupported environments
  });
}

export { analytics };
export default app;
