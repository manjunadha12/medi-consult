import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";

// Official Firebase configuration for MediConsult
const firebaseConfig = {
  apiKey: "AIzaSyAjqyNHiSWvIpoAOXlOFNC9rPa7fCkdPN8",
  authDomain: "mediconsult-e5dd2.firebaseapp.com",
  projectId: "mediconsult-e5dd2",
  storageBucket: "mediconsult-e5dd2.firebasestorage.app",
  messagingSenderId: "995807119658",
  appId: "1:995807119658:web:a4710c03ae562acd28f653",
  measurementId: "G-6BHSLG22XW"
};

// Initialize Firebase Node
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use indexedDB if possible for better stability on mobile Capacitor apps
// Falls back to browserLocalPersistence (localStorage) if indexedDB is unavailable
setPersistence(auth, indexedDBLocalPersistence).catch(() => {
  setPersistence(auth, browserLocalPersistence);
});

export { auth };
export const googleProvider = new GoogleAuthProvider();

// Set custom parameters for Google Auth
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
