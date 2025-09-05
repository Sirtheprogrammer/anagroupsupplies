import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtKrU-jGQEUyAVzIstgktLNyxw2kgj2TE",
  authDomain: "m3outfit.firebaseapp.com",
  projectId: "m3outfit",
  storageBucket: "m3outfit.firebasestorage.app",
  messagingSenderId: "186180349582",
  appId: "1:186180349582:web:8a0f2f9a2e06deef4e63df",
  measurementId: "G-HQ5TPVDZ9Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db }; 