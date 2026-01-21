import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfig = {
  credential: cert({
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
