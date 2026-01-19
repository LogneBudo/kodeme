/**
 * Backfill Script: Mirror subcollection calendars to root collection
 *
 * For each organization, ensure a root-level calendar document exists for
 * its primary calendar (orgId-primary). Also optionally seed root settings.
 *
 * Usage:
 *  npx tsx src/scripts/backfillOrgCalendars.ts
 */
import { collection, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

async function backfill() {
  console.log("Starting calendar backfill...");
  const orgsSnap = await getDocs(collection(db, "organizations"));
  console.log(`Found ${orgsSnap.docs.length} organizations`);

  for (const orgDoc of orgsSnap.docs) {
    const org = orgDoc.data() as any;
    const orgId = org.org_id || orgDoc.id;
    const defaultCalendarId = `${orgId}-primary`;

    // Read subcollection calendar, if exists
    const subCalRef = doc(db, "organizations", orgId, "calendars", defaultCalendarId);
    const subCalSnap = await getDoc(subCalRef);

    let calendarData: any = null;
    if (subCalSnap.exists()) {
      calendarData = subCalSnap.data();
    } else {
      // Create a synthetic calendar if missing
      calendarData = {
        id: defaultCalendarId,
        org_id: orgId,
        name: "Primary Calendar",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        created_at: Timestamp.now(),
        created_by: org.owner_uid || "backfill-script",
      };
      console.log(`[backfill] Synthesized calendar for ${orgId}`);
    }

    // Mirror to root calendars collection
    const rootCalRef = doc(db, "calendars", defaultCalendarId);
    const rootCalSnap = await getDoc(rootCalRef);
    if (!rootCalSnap.exists()) {
      await setDoc(rootCalRef, calendarData);
      console.log(`[backfill] Created root calendar: ${defaultCalendarId}`);
    } else {
      console.log(`[backfill] Root calendar exists: ${defaultCalendarId}`);
    }

    // Seed root settings doc if missing
    const settingsId = `${orgId}_${defaultCalendarId}`;
    const rootSettingsRef = doc(db, "settings", settingsId);
    const rootSettingsSnap = await getDoc(rootSettingsRef);
    if (!rootSettingsSnap.exists()) {
      const payload = {
        org_id: orgId,
        calendar_id: defaultCalendarId,
        workingHours: { startTime: "09:00", endTime: "17:00" },
        workingDays: [1,2,3,4,5],
        blockedSlots: [],
        oneOffUnavailableSlots: [],
        calendarSync: {
          autoCreateEvents: true,
          showBusyTimes: false,
          syncCancellations: true,
        },
        restaurantCity: "",
        restaurantCountry: "",
        restaurantPerimeterKm: 5,
        restaurants: [],
        curatedList: "",
        updatedAt: Timestamp.now(),
      };
      try {
        await setDoc(rootSettingsRef, payload);
        console.log(`[backfill] Seeded root settings: ${settingsId}`);
      } catch (e) {
        console.warn(`[backfill] Failed to seed root settings (rules?): ${settingsId}`);
      }
    }
  }

  console.log("Backfill completed.");
}

backfill().catch((e) => {
  console.error("Backfill failed:", e);
});
