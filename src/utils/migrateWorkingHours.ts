/**
 * Migration utility for converting old working hours format (startHour/endHour integers)
 * to new format (startTime/endTime strings in HH:mm format).
 * 
 * Run this once if you have existing settings data with the old format:
 * 
 * ```typescript
 * import { migrateWorkingHours } from './utils/migrateWorkingHours';
 * await migrateWorkingHours();
 * ```
 */

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function migrateWorkingHours(): Promise<void> {
  try {
    const settingsRef = doc(db, "settings", "main");
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      console.log("No settings document found - nothing to migrate");
      return;
    }

    const data = settingsDoc.data();
    const workingHours = data.workingHours;

    // Check if already migrated (has startTime/endTime)
    if (workingHours && typeof workingHours.startTime === 'string') {
      console.log("Settings already migrated to new format");
      return;
    }

    // Check if old format exists (has startHour/endHour)
    if (workingHours && typeof workingHours.startHour === 'number') {
      const startTime = `${String(workingHours.startHour).padStart(2, '0')}:00`;
      const endTime = `${String(workingHours.endHour).padStart(2, '0')}:00`;

      await updateDoc(settingsRef, {
        'workingHours.startTime': startTime,
        'workingHours.endTime': endTime,
      });

      // Remove old fields
      await updateDoc(settingsRef, {
        'workingHours.startHour': null,
        'workingHours.endHour': null,
      });

      console.log(`✅ Migrated working hours: ${startTime} - ${endTime}`);
    } else {
      console.log("No old format detected - using defaults");
      await updateDoc(settingsRef, {
        workingHours: {
          startTime: "09:00",
          endTime: "17:00"
        }
      });
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
