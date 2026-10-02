import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbqSpVNRB0n4-fqKh2ZklLSP8-cB_9JZ4",
  authDomain: "gheras-system.firebaseapp.com",
  projectId: "gheras-system",
  storageBucket: "://appspot.com",
  messagingSenderId: "839683765479",
  appId: "1:839683765479:web:6847ed6b4d939a13555e42",
  measurementId: "G-MXDS770P1Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
