import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";
import type { Organization } from "../types/organization";
import type { Calendar } from "../types/branch";

// ============ TIME SLOTS ============

export async function listTimeSlots(): Promise<TimeSlot[]> {
  try {
    // Enforce plan limits: max calendars per organization
    const org = await getOrganization(orgId);
    const tier = (org?.subscription_tier || "free") as import("../types/subscriptionTier").SubscriptionTierName;
    const { TIER_DEFINITIONS } = await import("../types/subscriptionTier");
    const maxCalendars = TIER_DEFINITIONS[tier].features.calendar_max_calendars;
    const existing = await listTenantCalendars(orgId);
    if (existing.length >= maxCalendars) {
      throw new Error(`Your plan allows up to ${maxCalendars} calendar${maxCalendars > 1 ? 's' : ''}.`);
    }
    const slotsRef = collection(db, "time_slots");
    // Single orderBy keeps us within Firestore's built-in indexes; we sort by time client-side
    const q = query(slotsRef, orderBy("date", "asc"));
    const snapshot = await getDocs(q);

    const slots = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        time: data.time,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TimeSlot;
    });

    // Sort by date then time client-side
    return slots.sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return [];
  }
}

export async function getTimeSlot(id: string): Promise<TimeSlot | null> {
  try {
    const docRef = doc(db, "time_slots", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      date: data.date,
      time: data.time,
      status: data.status,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TimeSlot;
  } catch (error) {
    console.error("Error fetching time slot:", error);
    return null;
  }
}

export async function createTimeSlot(
  data: Omit<TimeSlot, "id" | "createdAt" | "updatedAt">
): Promise<TimeSlot> {
  try {
    const slotsRef = collection(db, "time_slots");
    const now = Timestamp.now();

    const docRef = await addDoc(slotsRef, {
      date: data.date,
      time: data.time,
      status: data.status || "available",
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      ...data,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error("Error creating time slot:", error);
    throw error;
  }
}

// Fix updateTimeSlot
export async function updateTimeSlot(
  id: string,
  patch: Partial<TimeSlot>
): Promise<TimeSlot | null> {
  try {
    const docRef = doc(db, "time_slots", id);
    // Remove id and createdAt from patch using destructuring
    // Remove id and createdAt from patch using a utility function
    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      const ret = { ...obj };
      for (const key of keys) {
        delete ret[key];
      }
      return ret;
    };
    const updateData = {
      ...omit(patch, ["id", "createdAt"]),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);
    return getTimeSlot(id);
  } catch (error) {
    console.error("Error updating time slot:", error);
    return null;
  }
}

export async function deleteTimeSlot(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "time_slots", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return false;
  }
}

export async function bulkCreateTimeSlots(
  data: Omit<TimeSlot, "id" | "createdAt" | "updatedAt">[]
): Promise<TimeSlot[]> {
  try {
    const slotsRef = collection(db, "time_slots");
    const now = Timestamp.now();
    const created: TimeSlot[] = [];

    for (const slotData of data) {
      const docRef = await addDoc(slotsRef, {
        date: slotData.date,
        time: slotData.time,
        status: slotData.status || "available",
        createdAt: now,
        updatedAt: now,
      });

      created.push({
        id: docRef.id,
        ...slotData,
        status: slotData.status || "available",
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      });
    }

    return created;
  } catch (error) {
    console.error("Error bulk creating time slots:", error);
    throw error;
  }
}

// ============ APPOINTMENTS ============

export async function listAppointments(): Promise<Appointment[]> {
  try {
    const aptsRef = collection(db, "appointments");
    const q = query(aptsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slotId: data.slotId,
        email: data.email,
        locationDetails: data.locationDetails,
        status: data.status,
        appointmentDate: data.appointmentDate,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        notes: data.notes,
      } as Appointment;
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  try {
    const docRef = doc(db, "appointments", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      slotId: data.slotId,
      email: data.email,
      locationDetails: data.locationDetails,
      status: data.status,
      appointmentDate: data.appointmentDate,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      notes: data.notes,
    } as Appointment;
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }
}

// Fix createAppointment
export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "expiresAt">
): Promise<Appointment> {
  try {
    const aptsRef = collection(db, "appointments");
    const now = Timestamp.now();
    const expiresAt = new Date(now.toDate());
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now
    // Build Firestore-safe payload (no undefined values)
    const payload: Omit<Appointment, "id" | "createdAt" | "expiresAt"> & { createdAt: Timestamp; expiresAt: Date } = {
      slotId: data.slotId,
      email: data.email,
      locationDetails: {
        type: data.locationDetails?.type,
      },
      status: data.status,
      appointmentDate: data.appointmentDate,
      createdAt: now,
      expiresAt,
      notes: data.notes,
    };
    const docRef = await addDoc(aptsRef, payload);
    return getAppointment(docRef.id) as Promise<Appointment>;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

// Atomic booking: create appointment + mark slot as booked in a single transaction
export async function createAppointmentWithSlot(
  appointmentData: Omit<Appointment, "id" | "createdAt" | "expiresAt">,
  slotId: string
): Promise<Appointment> {
  try {
    const batch = writeBatch(db);
    
    // Create appointment document
    const aptsRef = collection(db, "appointments");
    const appointmentDocRef = doc(aptsRef); // Generate new doc ref
    const now = Timestamp.now();
    const expiresAt = new Date(now.toDate());
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const appointmentPayload = {
      slotId: appointmentData.slotId,
      email: appointmentData.email,
      locationDetails: {
        type: appointmentData.locationDetails?.type,
      },
      status: appointmentData.status,
      appointmentDate: appointmentData.appointmentDate,
      createdAt: now,
      expiresAt,
      notes: appointmentData.notes,
    };
    
    batch.set(appointmentDocRef, appointmentPayload);
    
    // Update slot status to booked
    const slotRef = doc(db, "time_slots", slotId);
    batch.update(slotRef, {
      status: "booked",
      updatedAt: now,
    });
    
    // Commit both operations atomically
    await batch.commit();
    
    // Return the created appointment
    return getAppointment(appointmentDocRef.id) as Promise<Appointment>;
  } catch (error) {
    console.error("Error creating appointment with slot:", error);
    throw error;
  }
}

// Fix updateAppointment
export async function updateAppointment(
  id: string,
  patch: Partial<Appointment>
): Promise<Appointment | null> {
  try {
    const docRef = doc(db, "appointments", id);
    const updateData: Partial<Omit<Appointment, 'id' | 'createdAt'>> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(),
    };
    if (patch.slotId !== undefined) updateData.slotId = patch.slotId;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.appointmentDate !== undefined) updateData.appointmentDate = patch.appointmentDate;
    if (patch.notes !== undefined) updateData.notes = patch.notes;
    await updateDoc(docRef, updateData);
    return getAppointment(id);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return null;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "appointments", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return false;
  }
}

// ============ QUERIES ============

/**
 * Get all appointments for a specific date
 */
export async function getAppointmentsByDate(
  date: string
): Promise<Appointment[]> {
  try {
    const aptsRef = collection(db, "appointments");
    const q = query(
      aptsRef,
      where("appointmentDate", "==", date),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slotId: data.slotId,
        email: data.email,
        locationDetails: data.locationDetails,
        status: data.status,
        appointmentDate: data.appointmentDate,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        notes: data.notes,
      } as Appointment;
    });
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    return [];
  }
}

/**
 * Get all slots for a specific date
 */
export async function getSlotsByDate(date: string): Promise<TimeSlot[]> {
  try {
    const slotsRef = collection(db, "time_slots");
    // Remove extra orderBy to avoid composite index requirement; sort client-side
    const q = query(slotsRef, where("date", "==", date));
    const snapshot = await getDocs(q);

    const slots = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        time: data.time,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TimeSlot;
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error("Error fetching slots by date:", error);
    return [];
  }
}

// ============ USERS ============

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
};

export async function listUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function addUser(uid: string, email: string, role: "admin" | "user"): Promise<User | null> {
  try {
    // Enforce free plan: one organization per user
    const selectedTier = (params.subscription_tier || "free") as any;
    if (selectedTier === "free") {
      // If the user already has an org_id or owns any organization, block creation
      const userRef = doc(db, "users", params.created_by);
      const userSnap = await getDoc(userRef);
      const existingOrgId = userSnap.exists() ? (userSnap.data().org_id || null) : null;
      if (existingOrgId) {
        throw new Error("Free plan allows a single organization per user.");
      }
      const orgsOwnedQ = query(collection(db, "organizations"), where("owner_uid", "==", params.created_by));
      const orgsOwnedSnap = await getDocs(orgsOwnedQ);
      if (!orgsOwnedSnap.empty) {
        throw new Error("Free plan allows a single organization per user.");
      }
    }

    const now = Timestamp.now();
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      email,
      role,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: uid,
      email,
      role,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error("Error adding user:", error);
    return null;
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user"): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}

// ============ SETTINGS ============

export type WorkingHours = {
  startTime: string; // "HH:mm" format (e.g., "09:00")
  endTime: string;   // "HH:mm" format (e.g., "17:30")
};

// Working days are stored as an array of day indexes (0=Sunday, 6=Saturday).
// We normalize any legacy shape (startDay/endDay) to this array on read.
export type WorkingDays = number[];

export type BlockedSlot = {
  _key: string;
  // Optional date for one-off blocks; if omitted, block applies to every day
  date?: string; // "yyyy-MM-dd"
  startTime: string; // "12:00"
  endTime: string;   // "13:00"
  label: string;     // "Lunch break"
};

export type UnavailableSlot = {
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm"
  label?: string;
};

export type CalendarSync = {
  autoCreateEvents: boolean;
  showBusyTimes: boolean;
  syncCancellations: boolean;
};

import type { Restaurant } from "../types/restaurant";

export type Settings = {
  id?: string;
  workingHours: WorkingHours;
  workingDays: WorkingDays;
  blockedSlots: BlockedSlot[];
  oneOffUnavailableSlots: UnavailableSlot[];
  updatedAt?: Date;
  calendarSync: CalendarSync;
  // Restaurant settings
  restaurantCity?: string;
  restaurantCountry?: string;
  restaurantPerimeterKm?: number;
  restaurants?: Restaurant[];
  curatedList?: string;
};

const SETTINGS_DOC = "main";
const DEFAULT_WORKING_DAYS: WorkingDays = [1, 2, 3, 4, 5];

function normalizeWorkingDays(raw: unknown): WorkingDays {
  // If already an array, sanitize numbers and ensure at least one day.
  if (Array.isArray(raw)) {
    const days = Array.from(new Set(raw.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b);
    return days.length > 0 ? days : DEFAULT_WORKING_DAYS;
  }

  // Legacy shape { startDay, endDay }
  if (raw && typeof raw === "object" && "startDay" in (raw as Record<string, unknown>) && "endDay" in (raw as Record<string, unknown>)) {
    const start = Number((raw as { startDay: unknown }).startDay);
    const end = Number((raw as { endDay: unknown }).endDay);
    const days: number[] = [];
    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= 6 && end >= 0 && end <= 6) {
      if (start <= end) {
        for (let i = start; i <= end; i++) days.push(i);
      } else {
        for (let i = start; i <= 6; i++) days.push(i);
        for (let i = 0; i <= end; i++) days.push(i);
      }
    }
    const unique = Array.from(new Set(days)).sort((a, b) => a - b);
    return unique.length > 0 ? unique : DEFAULT_WORKING_DAYS;
  }

  return DEFAULT_WORKING_DAYS;
}

export async function getSettings(): Promise<Settings> {
  try {
    const settingsRef = doc(db, "settings", SETTINGS_DOC);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        id: settingsDoc.id,
        workingHours: data.workingHours || { startTime: "09:00", endTime: "17:00" },
        workingDays: normalizeWorkingDays(data.workingDays),
        blockedSlots: data.blockedSlots || [],
        oneOffUnavailableSlots: data.oneOffUnavailableSlots || [],
        updatedAt: data.updatedAt?.toDate() || new Date(),
        calendarSync: data.calendarSync || {
          autoCreateEvents: true,
          showBusyTimes: false,
          syncCancellations: true,
        },
        restaurantCity: data.restaurantCity || "",
        restaurantCountry: data.restaurantCountry || "",
        restaurantPerimeterKm: data.restaurantPerimeterKm || 5,
        restaurants: data.restaurants || [],
        curatedList: data.curatedList || "",
      };
    } else {
      // Return default settings if not found
      return {
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
      };
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return default settings on error
    return {
      workingHours: { startTime: "09:00", endTime: "17:00" },
      workingDays: DEFAULT_WORKING_DAYS,
      blockedSlots: [],
      oneOffUnavailableSlots: [],
      calendarSync: {
        autoCreateEvents: false,
        showBusyTimes: false,
        syncCancellations: false,
      },
      restaurantCity: "",
      restaurantCountry: "",
      restaurantPerimeterKm: 5,
      restaurants: [],
      curatedList: "",
    };
  }
}

export async function updateSettings(settings: Settings): Promise<boolean> {
  try {
    const settingsRef = doc(db, "settings", SETTINGS_DOC);
    await setDoc(settingsRef, {
      workingHours: settings.workingHours,
      workingDays: settings.workingDays || DEFAULT_WORKING_DAYS,
      blockedSlots: settings.blockedSlots,
      oneOffUnavailableSlots: settings.oneOffUnavailableSlots || [],
      calendarSync: settings.calendarSync || {
        autoCreateEvents: true,
        showBusyTimes: false,
        syncCancellations: true,
      },
      restaurantCity: settings.restaurantCity || "",
      restaurantCountry: settings.restaurantCountry || "",
      restaurantPerimeterKm: settings.restaurantPerimeterKm || 5,
      restaurants: settings.restaurants || [],
      curatedList: settings.curatedList || "",
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    return false;
  }
}

// ============================================================================
// PHASE 2: MULTI-TENANT API FUNCTIONS
// ============================================================================

// ============ PHASE 2.1: TIME SLOTS (TENANT-AWARE) ============

/**
 * List time slots for a specific org/branch (tenant-aware)
 * Throws error if org_id or calendar_id are invalid
 */
export async function listTenantTimeSlots(
  orgId: string,
  calendarId: string
): Promise<TimeSlot[]> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const slotsRef = collection(db, "time_slots");
    const q = query(
      slotsRef,
      where("org_id", "==", orgId),
      where("calendar_id", "==", calendarId),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);

    let slots = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        org_id: data.org_id,
        calendar_id: data.calendar_id,
        date: data.date,
        time: data.time,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TimeSlot;
    });

    // Fallback for legacy single-tenant slots without org/calendar fields
    if (slots.length === 0) {
      const legacySnapshot = await getDocs(query(slotsRef, orderBy("date", "asc")));
      slots = legacySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          org_id: data.org_id,
          calendar_id: data.calendar_id,
          date: data.date,
          time: data.time,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as TimeSlot;
      });
      console.warn(
        `[time_slots] Using legacy fallback (no org/calendar fields) for org=${orgId}, calendar=${calendarId}`
      );
    }

    return slots
      .filter((s) => !s.org_id || s.org_id === orgId)
      .filter((s) => !s.calendar_id || s.calendar_id === calendarId)
      .sort((a, b) => {
        const d = String(a.date).localeCompare(String(b.date));
        if (d !== 0) return d;
        return String(a.time).localeCompare(String(b.time));
      });
  } catch (error) {
    const err = error as any;
    const message = String(err?.message || "");
    // Fallback if index missing or other query failure: fetch all, filter client-side
    if (err?.code === "failed-precondition" || message.includes("requires an index")) {
      try {
        const slotsRef = collection(db, "time_slots");
        const snapshot = await getDocs(query(slotsRef, orderBy("date", "asc")));
        const slots = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              org_id: data.org_id,
              calendar_id: data.calendar_id,
              date: data.date,
              time: data.time,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as TimeSlot;
          })
          .filter((s) => (!s.org_id || s.org_id === orgId) && (!s.calendar_id || s.calendar_id === calendarId))
          .sort((a, b) => {
            const d = String(a.date).localeCompare(String(b.date));
            if (d !== 0) return d;
            return String(a.time).localeCompare(String(b.time));
          });
        console.warn(
          `[time_slots] Using index fallback for org=${orgId}, calendar=${calendarId}`
        );
        return slots;
      } catch (fallbackErr) {
        console.error(
          `Fallback query also failed for org=${orgId}, calendar=${calendarId}:`,
          fallbackErr
        );
        throw fallbackErr;
      }
    }

    console.error(
      `Error fetching time slots for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get a single time slot (tenant-aware)
 */
export async function getTenantTimeSlot(
  orgId: string,
  calendarId: string,
  id: string
): Promise<TimeSlot | null> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const docRef = doc(db, "time_slots", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();

    // Verify org/branch match
    if (data.org_id !== orgId || data.calendar_id !== calendarId) {
      throw new Error("Time slot does not belong to this org/branch");
    }

    return {
      id: docSnap.id,
      org_id: data.org_id,
      calendar_id: data.calendar_id,
      date: data.date,
      time: data.time,
      status: data.status,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TimeSlot;
  } catch (error) {
    console.error(
      `Error fetching time slot ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create a time slot (tenant-aware)
 */
export async function createTenantTimeSlot(
  orgId: string,
  calendarId: string,
  data: Omit<TimeSlot, "id" | "org_id" | "calendar_id" | "createdAt" | "updatedAt">
): Promise<TimeSlot> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const slotsRef = collection(db, "time_slots");
    const now = Timestamp.now();

    const docRef = await addDoc(slotsRef, {
      org_id: orgId,
      calendar_id: calendarId,
      date: data.date,
      time: data.time,
      status: data.status || "available",
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      org_id: orgId,
      calendar_id: calendarId,
      ...data,
      status: data.status || "available",
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error(
      `Error creating time slot for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Update a time slot (tenant-aware)
 */
export async function updateTenantTimeSlot(
  orgId: string,
  calendarId: string,
  id: string,
  patch: Partial<TimeSlot>
): Promise<TimeSlot | null> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    await getTenantTimeSlot(orgId, calendarId, id);

    const docRef = doc(db, "time_slots", id);
    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      const ret = { ...obj };
      for (const key of keys) {
        delete ret[key];
      }
      return ret;
    };
    const updateData = {
      ...omit(patch, ["id", "org_id", "calendar_id", "createdAt"]),
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData);
    return getTenantTimeSlot(orgId, calendarId, id);
  } catch (error) {
    console.error(
      `Error updating time slot ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a time slot (tenant-aware)
 */
export async function deleteTenantTimeSlot(
  orgId: string,
  calendarId: string,
  id: string
): Promise<boolean> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    await getTenantTimeSlot(orgId, calendarId, id);

    const docRef = doc(db, "time_slots", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(
      `Error deleting time slot ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

// ============ PHASE 2.2: APPOINTMENTS (TENANT-AWARE) ============

/**
 * List appointments for a specific org/branch (tenant-aware)
 */
export async function listTenantAppointments(
  orgId: string,
  calendarId: string
): Promise<Appointment[]> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const aptsRef = collection(db, "appointments");
    const q = query(
      aptsRef,
      where("org_id", "==", orgId),
      where("calendar_id", "==", calendarId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        org_id: data.org_id,
        calendar_id: data.calendar_id,
        slotId: data.slotId,
        email: data.email,
        locationDetails: data.locationDetails,
        status: data.status,
        appointmentDate: data.appointmentDate,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        notes: data.notes,
      } as Appointment;
    });
  } catch (error) {
    // Fallback: if composite index is missing or still building, perform a simpler query
    const err = error as any;
    const message = String(err?.message || "");
    if (err?.code === "failed-precondition" || message.includes("requires an index")) {
      try {
        const aptsRef = collection(db, "appointments");
        // Use single-field equality on org_id to satisfy security rule and avoid composite index; sort client-side
        const q2 = query(aptsRef, where("org_id", "==", orgId));
        const snapshot2 = await getDocs(q2);
        const items = snapshot2.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              org_id: data.org_id,
              calendar_id: data.calendar_id,
              slotId: data.slotId,
              email: data.email,
              locationDetails: data.locationDetails,
              status: data.status,
              appointmentDate: data.appointmentDate,
              createdAt: data.createdAt?.toDate() || new Date(),
              expiresAt: data.expiresAt?.toDate() || new Date(),
              notes: data.notes,
            } as Appointment;
          })
          .filter((a) => a.calendar_id === calendarId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.warn(
          `[appointments] Using fallback query while index builds for org=${orgId}, calendar=${calendarId}`
        );
        return items;
      } catch (fallbackErr) {
        console.error(
          `Fallback query also failed for org=${orgId}, branch=${calendarId}:`,
          fallbackErr
        );
        throw fallbackErr;
      }
    }
    console.error(
      `Error fetching appointments for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get a single appointment (tenant-aware)
 */
export async function getTenantAppointment(
  orgId: string,
  calendarId: string,
  id: string
): Promise<Appointment | null> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const docRef = doc(db, "appointments", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();

    // Verify org/branch match
    if (data.org_id !== orgId || data.calendar_id !== calendarId) {
      throw new Error("Appointment does not belong to this org/branch");
    }

    return {
      id: docSnap.id,
      org_id: data.org_id,
      calendar_id: data.calendar_id,
      slotId: data.slotId,
      email: data.email,
      locationDetails: data.locationDetails,
      status: data.status,
      appointmentDate: data.appointmentDate,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      notes: data.notes,
    } as Appointment;
  } catch (error) {
    console.error(
      `Error fetching appointment ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create an appointment (tenant-aware)
 */
export async function createTenantAppointment(
  orgId: string,
  calendarId: string,
  data: Omit<Appointment, "id" | "org_id" | "calendar_id" | "createdAt" | "expiresAt">
): Promise<Appointment> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const aptsRef = collection(db, "appointments");
    const now = Timestamp.now();
    const expiresAt = new Date(now.toDate());
    expiresAt.setDate(expiresAt.getDate() + 90);

    const docRef = await addDoc(aptsRef, {
      org_id: orgId,
      calendar_id: calendarId,
      slotId: data.slotId,
      email: data.email,
      locationDetails: {
        type: data.locationDetails?.type,
      },
      status: data.status,
      appointmentDate: data.appointmentDate,
      createdAt: now,
      expiresAt,
      notes: data.notes,
    });

    return getTenantAppointment(orgId, calendarId, docRef.id) as Promise<Appointment>;
  } catch (error) {
    console.error(
      `Error creating appointment for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Atomic booking: create appointment + mark slot as booked (tenant-aware)
 */
export async function createTenantAppointmentWithSlot(
  orgId: string,
  calendarId: string,
  appointmentData: Omit<Appointment, "id" | "org_id" | "calendar_id" | "createdAt" | "expiresAt">,
  slotId: string
): Promise<Appointment> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const batch = writeBatch(db);
    
    // Create appointment document
    const aptsRef = collection(db, "appointments");
    const appointmentDocRef = doc(aptsRef); // Generate new doc ref
    const now = Timestamp.now();
    const expiresAt = new Date(now.toDate());
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const appointmentPayload = {
      org_id: orgId,
      calendar_id: calendarId,
      slotId: appointmentData.slotId,
      email: appointmentData.email,
      locationDetails: {
        type: appointmentData.locationDetails?.type,
      },
      status: appointmentData.status,
      appointmentDate: appointmentData.appointmentDate,
      createdAt: now,
      expiresAt,
      notes: appointmentData.notes,
    };
    
    batch.set(appointmentDocRef, appointmentPayload);
    
    // Update slot status to booked
    const slotRef = doc(db, "time_slots", slotId);
    batch.update(slotRef, {
      status: "booked",
      updatedAt: now,
    });
    
    // Commit both operations atomically
    await batch.commit();
    
    // Return the created appointment
    return getTenantAppointment(orgId, calendarId, appointmentDocRef.id) as Promise<Appointment>;
  } catch (error) {
    console.error("Error creating tenant appointment with slot:", error);
    throw error;
  }
}

/**
 * Update an appointment (tenant-aware)
 */
export async function updateTenantAppointment(
  orgId: string,
  calendarId: string,
  id: string,
  patch: Partial<Appointment>
): Promise<Appointment | null> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    await getTenantAppointment(orgId, calendarId, id);

    const docRef = doc(db, "appointments", id);
    const updateData: Partial<Omit<Appointment, 'id' | 'createdAt'>> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(),
    };
    if (patch.slotId !== undefined) updateData.slotId = patch.slotId;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.appointmentDate !== undefined) updateData.appointmentDate = patch.appointmentDate;
    if (patch.notes !== undefined) updateData.notes = patch.notes;

    await updateDoc(docRef, updateData);
    return getTenantAppointment(orgId, calendarId, id);
  } catch (error) {
    console.error(
      `Error updating appointment ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete an appointment (tenant-aware)
 */
export async function deleteTenantAppointment(
  orgId: string,
  calendarId: string,
  id: string
): Promise<boolean> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    // Verify ownership first
    await getTenantAppointment(orgId, calendarId, id);

    const docRef = doc(db, "appointments", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(
      `Error deleting appointment ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

// ============ PHASE 2.3: SETTINGS (TENANT-AWARE) ============

/**
 * Get settings for a specific org/branch
 * Settings are stored with key format: {orgId}_{calendarId}
 */
export async function getTenantSettings(
  orgId: string,
  calendarId: string
): Promise<Settings> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const settingsKey = `${orgId}_${calendarId}`;
    const settingsRef = doc(db, "settings", settingsKey);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        id: settingsDoc.id,
        workingHours: data.workingHours || { startTime: "09:00", endTime: "17:00" },
        workingDays: normalizeWorkingDays(data.workingDays),
        blockedSlots: data.blockedSlots || [],
        oneOffUnavailableSlots: data.oneOffUnavailableSlots || [],
        updatedAt: data.updatedAt?.toDate() || new Date(),
        calendarSync: data.calendarSync || {
          autoCreateEvents: true,
          showBusyTimes: false,
          syncCancellations: true,
        },
        restaurantCity: data.restaurantCity || "",
        restaurantCountry: data.restaurantCountry || "",
        restaurantPerimeterKm: data.restaurantPerimeterKm || 5,
        restaurants: data.restaurants || [],
        curatedList: data.curatedList || "",
      };
    } else {
      // Return default settings if not found
      return {
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
      };
    }
  } catch (error) {
    console.error(
      `Error fetching settings for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

/**
 * Update settings for a specific org/branch
 */
export async function updateTenantSettings(
  orgId: string,
  calendarId: string,
  settings: Settings
): Promise<boolean> {
  if (!orgId || !calendarId) {
    throw new Error("orgId and calendarId are required");
  }

  try {
    const settingsKey = `${orgId}_${calendarId}`;
    const settingsRef = doc(db, "settings", settingsKey);
    await setDoc(settingsRef, {
      org_id: orgId,
      calendar_id: calendarId,
      workingHours: settings.workingHours,
      workingDays: settings.workingDays || DEFAULT_WORKING_DAYS,
      blockedSlots: settings.blockedSlots,
      oneOffUnavailableSlots: settings.oneOffUnavailableSlots || [],
      calendarSync: settings.calendarSync || {
        autoCreateEvents: true,
        showBusyTimes: false,
        syncCancellations: true,
      },
      restaurantCity: settings.restaurantCity || "",
      restaurantCountry: settings.restaurantCountry || "",
      restaurantPerimeterKm: settings.restaurantPerimeterKm || 5,
      restaurants: settings.restaurants || [],
      curatedList: settings.curatedList || "",
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error(
      `Error updating settings for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}

// ============ PHASE 2.4: TENANT MANAGEMENT FUNCTIONS ============

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
      subscription_tier: (params.subscription_tier || "free") as any,
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

    if (!orgSnap.exists()) {
      console.warn(`[org] Organization ${orgId} not found`);
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

/**
 * List all users in an organization (all branches)
 */
export async function listTenantUsers(orgId: string): Promise<User[]> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("org_id", "==", orgId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        org_id: data.org_id,
        branch_assignments: data.branch_assignments || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User & { org_id: string; branch_assignments: Record<string, string> };
    });
  } catch (error) {
    // Fallback if composite index missing or still building
    const err = error as any;
    const message = String(err?.message || "");
    if (err?.code === "failed-precondition" || message.includes("requires an index")) {
      try {
        const usersRef = collection(db, "users");
        const q2 = query(usersRef, where("org_id", "==", orgId));
        const snapshot2 = await getDocs(q2);
        const items = snapshot2.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              role: data.role,
              org_id: data.org_id,
              branch_assignments: data.branch_assignments || {},
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as User & { org_id: string; branch_assignments: Record<string, string> };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.warn(`[users] Using fallback query while index builds for org=${orgId}`);
        return items;
      } catch (fallbackErr) {
        console.error(`Fallback users query failed for org=${orgId}:`, fallbackErr);
        throw fallbackErr;
      }
    }
    console.error(`Error fetching users for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Invite a user to an organization and assign to branch(es)
 * This creates/updates the user doc with org_id and calendar_assignments
 */
export async function inviteUserToTenant(
  userId: string,
  orgId: string,
  branchAssignments: Record<string, string> // { calendarId: role }
): Promise<boolean> {
  if (!userId || !orgId || !branchAssignments || Object.keys(branchAssignments).length === 0) {
    throw new Error("userId, orgId, and branchAssignments are required");
  }

  try {
    const userRef = doc(db, "users", userId);
    const now = Timestamp.now();

    await setDoc(
      userRef,
      {
        org_id: orgId,
        branch_assignments: branchAssignments,
        invited_at: now,
        updated_at: now,
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error(
      `Error inviting user ${userId} to org ${orgId}:`,
      error
    );
    throw error;
  }
}

/**
 * Remove a user from an organization
 * This clears their org_id and calendar_assignments
 */
export async function removeUserFromTenant(userId: string): Promise<boolean> {
  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      org_id: null,
      branch_assignments: {},
      updated_at: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error(`Error removing user ${userId} from tenant:`, error);
    throw error;
  }
}

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
    const err = error as any;
    const message = String(err?.message || "");
    if (err?.code === "failed-precondition" || message.includes("requires an index")) {
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
      console.warn(`[calendar] Calendar ${calendarId} not found in root calendars collection`);
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

// ============ TIER LIMIT CHECKING (SKELETON) ============

/**
 * Check if organization can add more users (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4 with auth context
 */
export async function canAddUserToTenant(orgId: string): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement tier-based user limit checking
    // For now, allow unlimited users
    return true;
  } catch (error) {
    console.error(`Error checking user limit for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Check if organization can add more branches (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4
 */
export async function canAddBranchToTenant(orgId: string): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement tier-based branch limit checking
    // For now, allow unlimited branches
    return true;
  } catch (error) {
    console.error(`Error checking branch limit for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Check if organization has access to a feature (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4
 */
export async function hasTierFeature(
  orgId: string,
  feature: string
): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement feature-flag checking based on subscription_tier
    // For now, allow all features
    return true;
  } catch (error) {
    console.error(
      `Error checking feature access for org ${orgId}, feature ${feature}:`,
      error
    );
    throw error;
  }
}

