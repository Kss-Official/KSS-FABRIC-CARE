import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const getEnv = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSy_demo_key_fabric_care_1f384'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'fabric-care-1f384.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'fabric-care-1f384'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'fabric-care-1f384.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '952254325643'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:952254325643:web:f2c0cbbba37c25549c058e'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-G7VVZ44JH4')
};

// Determine whether a genuine Firebase Web API key is configured
export const isRealApiKey = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('placeholder') &&
  !firebaseConfig.apiKey.includes('demo') &&
  !firebaseConfig.apiKey.includes('your_api_key')
);

// Initialize Firebase as a singleton instance
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication only with a valid non-placeholder API key.
// When a placeholder key is used, getAuth(app) attempts an iframe network call
// to Identity Toolkit (https://www.googleapis.com/identitytoolkit/...) which fails with 400 Bad Request.
export const auth = isRealApiKey ? getAuth(app) : null;

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

let analytics = null;
if (typeof window !== 'undefined' && isRealApiKey) {
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
