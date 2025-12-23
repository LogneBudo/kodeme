import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9RQnOObvO47Uk8I7RTbzl968vW1itIYM",
  authDomain: "easyappointment-6d2a1.firebaseapp.com",
  projectId: "easyappointment-6d2a1",
  storageBucket: "easyappointment-6d2a1.appspot.com",
  messagingSenderId: "361529248388",
  appId: "1:361529248388:web:f3544522a6740b922410d1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
