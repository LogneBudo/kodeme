import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration loaded from environment variables
// See .env.example for required variables
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required environment variables are set
const missingVars: string[] = [];
if (!import.meta.env.VITE_FIREBASE_API_KEY) missingVars.push("VITE_FIREBASE_API_KEY");
if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missingVars.push("VITE_FIREBASE_AUTH_DOMAIN");
if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missingVars.push("VITE_FIREBASE_PROJECT_ID");
if (!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) missingVars.push("VITE_FIREBASE_STORAGE_BUCKET");
if (!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) missingVars.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
if (!import.meta.env.VITE_FIREBASE_APP_ID) missingVars.push("VITE_FIREBASE_APP_ID");

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(", ")}. ` +
    `Please add them to your .env file or Vercel environment settings.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
