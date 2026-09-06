import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDYp23f4UlPEFpRounnI1MACRW5t08n2Y8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'task-management-systemx.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'task-management-systemx',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'task-management-systemx.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '683562334759',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:683562334759:web:b07dd268546d926792ac02',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-B8D4D7T1GV'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
