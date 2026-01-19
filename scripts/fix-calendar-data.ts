/**
 * Fix calendar data: create root calendar document and fix user org_id
 * Run with: npm run fix-calendar
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

// Firebase config from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase config loaded:");
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Auth Domain: ${firebaseConfig.authDomain}`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCalendarData() {
  const userId = "f0hdtOnHEqhTXS1FhgTWlo7yHGA3";
  const correctOrgId = "rE88jIrf0ntQUqF05B5B";
  const calendarId = "rE88jIrf0ntQUqF05B5B-primary";

  console.log("Starting calendar data fix...");

  try {
    // Step 1: Create calendar in root collection with known data
    console.log(`\n1. Creating calendar in root calendars/${calendarId}...`);
    const rootCalendarRef = doc(db, "calendars", calendarId);
    
    // Check if it already exists
    const existingCal = await getDoc(rootCalendarRef);
    if (existingCal.exists()) {
      console.log(`✓ Calendar already exists in root collection`);
    } else {
      const calendarData = {
        id: calendarId,
        org_id: correctOrgId,
        name: "Primary Calendar",
        timezone: "Europe/Bucharest",
        created_at: Timestamp.now(),
        created_by: userId,
      };
      
      await setDoc(rootCalendarRef, calendarData);
      console.log(`✓ Calendar created in root collection`);
    }

    // Step 2: Update user org_id
    console.log(`\n2. Updating user org_id...`);
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error(`❌ User not found!`);
      return;
    }

    const userData = userSnap.data();
    console.log(`Current org_id: ${userData.org_id}`);
    console.log(`Correct org_id: ${correctOrgId}`);

    if (userData.org_id !== correctOrgId) {
      await updateDoc(userRef, {
        org_id: correctOrgId,
      });
      console.log(`✓ User org_id updated to ${correctOrgId}`);
    } else {
      console.log(`✓ User org_id already correct`);
    }

    // Step 3: Verify branch_assignments
    console.log(`\n3. Verifying branch_assignments...`);
    const branchAssignments = userData.branch_assignments || {};
    console.log(`Branch assignments:`, branchAssignments);
    
    if (!branchAssignments[calendarId]) {
      console.log(`⚠️  Calendar ${calendarId} not in branch_assignments, adding...`);
      await updateDoc(userRef, {
        branch_assignments: {
          ...branchAssignments,
          [calendarId]: "owner",
        },
      });
      console.log(`✓ Added calendar to branch_assignments`);
    } else {
      console.log(`✓ Calendar already in branch_assignments`);
    }

    console.log("\n✅ All fixes completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Reload your app at /admin/debug");
    console.log("2. You should now see the organization and calendar");

  } catch (error) {
    console.error("\n❌ Error during fix:", error);
    throw error;
  }
}

// Run the fix
fixCalendarData()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nScript failed:", err);
    process.exit(1);
  });
