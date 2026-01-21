import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "./../../firebase";
import type { Calendar } from "../../types/branch";

// ============ CALENDAR MANAGEMENT (TENANT-AWARE) ============

/**
 * List all calendars for an organization
 */
export async function listTenantCalendars(orgId: string): Promise<Calendar[]> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const calendarsRef = collection(db, "calendars");
    const q = query(
      calendarsRef,
      where("org_id", "==", orgId),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        org_id: data.org_id,
        name: data.name,
        address: data.address,
        location: data.location,
        timezone: data.timezone,
        created_at: data.created_at?.toDate() || new Date(),
        created_by: data.created_by,
      };
    });
  } catch (error) {
    // Fallback: if composite index is missing or still building, perform a simpler query
    const err = error as unknown;
    let code: string | undefined = undefined;
    let message: string = "";
    if (typeof err === "object" && err !== null) {
      code = (err as { code?: string }).code;
      message = String((err as { message?: string }).message || "");
    }
    if (code === "failed-precondition" || message.includes("requires an index")) {
      try {
        const calendarsRef = collection(db, "calendars");
        const q2 = query(calendarsRef, where("org_id", "==", orgId));
        const snapshot2 = await getDocs(q2);
        const items = snapshot2.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              org_id: data.org_id,
              name: data.name,
              address: data.address,
              location: data.location,
              timezone: data.timezone,
              created_at: data.created_at?.toDate() || new Date(),
              created_by: data.created_by,
            } as Calendar;
          })
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        console.warn(`[calendars] Using fallback query while index builds for org=${orgId}`);
        return items;
      } catch (fallbackErr) {
        console.error(`Fallback calendars query failed for org=${orgId}:`, fallbackErr);
        throw fallbackErr;
      }
    }
    console.error(`Error listing calendars for org=${orgId}:`, error);
    throw error;
  }
}

// Lightweight fetch by calendar ID without org ownership checks; useful for diagnostics/fallback UI.
export async function getCalendarUnsafe(calendarId: string): Promise<Calendar | null> {
  if (!calendarId) return null;
  try {
    const calendarRef = doc(db, "calendars", calendarId);
    const snap = await getDoc(calendarRef);
    if (!snap.exists()) {
      interface WindowWithViteAuthDebug extends Window {
        VITE_AUTH_DEBUG?: string;
      }
      if (
        typeof window !== 'undefined' &&
        (window as WindowWithViteAuthDebug).VITE_AUTH_DEBUG === 'true'
      ) {
        console.warn(`[calendar] Calendar ${calendarId} not found in root calendars collection`);
      }
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      org_id: data.org_id,
      name: data.name,
      address: data.address,
      location: data.location,
      timezone: data.timezone,
      created_at: data.created_at?.toDate() || new Date(),
      created_by: data.created_by,
    } as Calendar;
  } catch (err) {
    console.error(`[calendar] getCalendarUnsafe failed for ${calendarId}:`, err);
    return null;
  }
}

/**
 * Get a single calendar by ID (with org verification)
 */
export async function getTenantCalendar(
  orgId: string,
  calendarId: string
): Promise<Calendar | null> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const calendarRef = doc(db, "calendars", calendarId);
    const snapshot = await getDoc(calendarRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    // Verify org ownership
    if (data.org_id !== orgId) {
      throw new Error("Unauthorized: calendar does not belong to this organization");
    }

    return {
      id: snapshot.id,
      org_id: data.org_id,
      name: data.name,
      address: data.address,
      location: data.location,
      timezone: data.timezone,
      created_at: data.created_at?.toDate() || new Date(),
      created_by: data.created_by,
    };
  } catch (error) {
    console.error(`Error getting calendar ${calendarId} for org=${orgId}:`, error);
    throw error;
  }
}

/**
 * Create a new calendar for an organization
 */
export async function createTenantCalendar(
  orgId: string,
  userId: string,
  data: { name: string; address?: string; location?: { lat: number; lng: number }; timezone: string }
): Promise<Calendar> {
  if (!orgId || !userId) {
    throw new Error("orgId and userId are required");
  }

  try {
    const calendarsRef = collection(db, "calendars");
    const docRef = await addDoc(calendarsRef, {
      org_id: orgId,
      name: data.name,
      address: data.address,
      location: data.location,
      timezone: data.timezone,
      created_at: Timestamp.now(),
      created_by: userId,
    });

    return getTenantCalendar(orgId, docRef.id) as Promise<Calendar>;
  } catch (error) {
    console.error(`Error creating calendar for org=${orgId}:`, error);
    throw error;
  }
}

/**
 * Update a calendar (org verification included)
 */
export async function updateTenantCalendar(
  orgId: string,
  calendarId: string,
  updates: Partial<Omit<Calendar, "id" | "org_id" | "created_at" | "created_by">>
): Promise<Calendar> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    const existing = await getTenantCalendar(orgId, calendarId);
    if (!existing) {
      throw new Error("Calendar not found or does not belong to this organization");
    }

    const calendarRef = doc(db, "calendars", calendarId);
    await updateDoc(calendarRef, updates);

    return getTenantCalendar(orgId, calendarId) as Promise<Calendar>;
  } catch (error) {
    console.error(`Error updating calendar ${calendarId} for org=${orgId}:`, error);
    throw error;
  }
}

/**
 * Delete a calendar (org verification included)
 */
export async function deleteTenantCalendar(orgId: string, calendarId: string): Promise<boolean> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    const existing = await getTenantCalendar(orgId, calendarId);
    if (!existing) {
      throw new Error("Calendar not found or does not belong to this organization");
    }

    // TODO: Check if calendar has active appointments/slots before deletion
    // For now, allow deletion

    const calendarRef = doc(db, "calendars", calendarId);
    await deleteDoc(calendarRef);

    return true;
  } catch (error) {
    console.error(`Error deleting calendar ${calendarId} for org=${orgId}:`, error);
    throw error;
  }
}
