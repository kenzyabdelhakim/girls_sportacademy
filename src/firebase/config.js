import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration — reads from env vars (see .env.example) with the
// existing project values as a fallback so the app keeps working for anyone
// without a local .env file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB9X-c2I1koXVPIx346RwUK-1OffHkrUh0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "girls-sportacademy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "girls-sportacademy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "girls-sportacademy.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "993824405765",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:993824405765:web:7b397329c6fa152b3fdf6c",
};

// Initialize Firebase
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Secondary app/auth instance used only for creating student accounts.
// createUserWithEmailAndPassword() signs in as the account it just created
// on whichever auth instance it's called with — running it here instead of
// on the primary `auth` keeps the admin's session untouched.
export const getSecondaryAuth = () => {
  const secondaryApp = getApps().find((a) => a.name === 'Secondary')
    || initializeApp(firebaseConfig, 'Secondary');
  return getAuth(secondaryApp);
};

export { auth, db };
export default app;

