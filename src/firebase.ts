import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbqSpVNRb0n4-fqKh2ZklLSP8-cB_9JZ4",
  authDomain: "gheras-system.firebaseapp.com",
  projectId: "gheras-system",
  storageBucket: "gheras-system.firebasestorage.app",
  messagingSenderId: "839683765479",
  appId: "1:839683765479:web:f89f858163b91948555e42",
  measurementId: "G-6Q6PXK8K6Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
