import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// CONFIGURE THESE:
const SOURCE_ID = 'main';
const DEST_ID = 'rE88jlrf0ntQUqF05B5B_rE88jlrf0ntQUqF05B5B-primary';

async function copySettings() {
  // Dynamically import the service account JSON
  const serviceAccountModule = await import('../easyappointment-6d2a1-firebase-adminsdk-fbsvc-9a5688aadb.json', { assert: { type: 'json' } });
  const serviceAccount = (serviceAccountModule.default || serviceAccountModule) as import('firebase-admin/app').ServiceAccount;

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const db = getFirestore();
  const srcRef = db.collection('settings').doc(SOURCE_ID);
  const destRef = db.collection('settings').doc(DEST_ID);

  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) {
    console.error('Source settings doc does not exist:', SOURCE_ID);
    process.exit(1);
  }

  const data = srcSnap.data();
  if (!data) {
    console.error('Source settings doc is empty:', SOURCE_ID);
    process.exit(1);
  }

  await destRef.set(data, { merge: true });
  console.log(`Copied settings from '${SOURCE_ID}' to '${DEST_ID}'`);
}

copySettings().catch((err) => {
  console.error('Error copying settings:', err);
  process.exit(1);
});
