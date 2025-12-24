import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "[REMOVED_API_KEY]",
  authDomain: "easyappointment-6d2a1.firebaseapp.example.com",
  projectId: "easyappointment-6d2a1",
  storageBucket: "easyappointment-6d2a1.appspot.com",
  messagingSenderId: "361529248388",
  appId: "[REMOVED_FIREBASE_APP_ID]",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
