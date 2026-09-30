import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace with actual config for production
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForGherasAppXYZ",
  authDomain: "gheras-erp.firebaseapp.com",
  projectId: "gheras-erp",
  storageBucket: "gheras-erp.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
