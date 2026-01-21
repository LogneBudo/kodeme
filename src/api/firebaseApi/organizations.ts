import {
  collection,
  updateDoc,
  getDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";


import { db } from "./../../firebase";
import type { Organization } from "../../types/organization";
import type { WorkingDays } from "./settings";
// ============ PHASE 2.4: TENANT MANAGEMENT FUNCTIONS ============
const DEFAULT_WORKING_DAYS: WorkingDays = [1, 2, 3, 4, 5];
/**
 * Create a new organization with primary calendar and settings
 * Called during new user setup (Phase 3)
 */
export async function createOrganization(params: {
  name: string;
  subscription_tier: string;
  created_by: string;
}): Promise<Organization | null> {
  if (!params.name || !params.created_by) {
    throw new Error("Organization name and created_by are required");
  }

  try {
    const now = Timestamp.now();
    
    // Generate organization ID
    const orgRef = doc(collection(db, "organizations"));
    const orgId = orgRef.id;
    
    // 1. Create organization document
    const org: Partial<Organization> & { org_id: string } = {
      org_id: orgId,
      name: params.name,
      subscription_tier: (params.subscription_tier || "free") as string,
      owner_uid: params.created_by,
    };
    
    await setDoc(orgRef, {
      ...org,
      created_at: now,
      updated_at: now,
    });
    console.log(`[setup] Created organization: ${orgId}`);
    
    // 2. Create default calendar in the root collection (single source of truth)
    const defaultCalendarId = `${orgId}-primary`;
    const calendar = {
      id: defaultCalendarId,
      org_id: orgId,
      name: "Primary Calendar",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      created_at: now,
      created_by: params.created_by,
    };

    const rootCalendarRef = doc(db, "calendars", defaultCalendarId);
    await setDoc(rootCalendarRef, calendar);
    console.log(`[setup] Created primary calendar in root collection: ${defaultCalendarId}`);
    
    // 3. Seed default tenant-aware settings in root collection for this calendar
    const settingsId = `${orgId}_${defaultCalendarId}`;
    const rootSettingsRef = doc(db, "settings", settingsId);
    const rootSettings = {
      org_id: orgId,
      calendar_id: defaultCalendarId,
      workingHours: { startTime: "09:00", endTime: "17:00" },
      workingDays: DEFAULT_WORKING_DAYS,
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
      updatedAt: now,
    };
    try {
      await setDoc(rootSettingsRef, rootSettings);
      console.log(`[setup] Seeded root settings: ${settingsId}`);
    } catch (e) {
      console.warn(`[setup] Root settings seed failed (non-admin may lack write). UI will use defaults until saved.`, e);
    }
    
    // 4. Update user document with org_id and calendar_assignments
    const userRef = doc(db, "users", params.created_by);
    const userData = await getDoc(userRef);
    
    const branch_assignments = userData.exists()
      ? userData.data().branch_assignments || {}
      : {};
    
    // Add calendar assignment with owner role
    branch_assignments[defaultCalendarId] = "owner";
    
    await setDoc(
      userRef,
      {
        org_id: orgId,
        branch_assignments,
        role: "owner",
        updated_at: now,
      },
      { merge: true }
    );
    
    console.log(`[setup] Updated user ${params.created_by} with org_id: ${orgId}`);
    
    // Return the created organization
    return getOrganization(orgId);
  } catch (error) {
    console.error("[setup] Failed to create organization:", error);
    throw error;
  }
}

/**
 * Get an organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const orgRef = doc(db, "organizations", orgId);
    const orgSnap = await getDoc(orgRef);

    console.log("getOrganization: orgId", orgId, "orgSnap.exists()", orgSnap.exists());
    
    if (!orgSnap.exists()) {
      if (
        typeof import.meta !== 'undefined' &&
        import.meta.env.VITE_AUTH_DEBUG === 'true'
      ) {
        console.warn(`[org] Organization ${orgId} not found`);
      }
      return null;
    }

    const data = orgSnap.data();
    return {
      ...data,
      org_id: orgSnap.id,
    } as unknown as Organization;
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`, error);
    throw error;
  }
}

/**
 * Get a tenant/organization by user (the user's primary org)
 * This is typically called during login to fetch the user's org
 */
export async function getTenantByUser(userId: string): Promise<Organization | null> {
  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const userData = userSnap.data();
    const orgId = userData.org_id;

    if (!orgId) return null;

    return getOrganization(orgId);
  } catch (error) {
    console.error(`Error fetching tenant for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update an organization
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
): Promise<Organization | null> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const orgRef = doc(db, "organizations", orgId);
    await updateDoc(orgRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    return getOrganization(orgId);
  } catch (error) {
    console.error(`Error updating organization ${orgId}:`, error);
    throw error;
  }
}
