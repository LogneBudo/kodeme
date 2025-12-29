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
} from "firebase/firestore";
import { db } from "../firebase";
import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";

// ============ TIME SLOTS ============

export async function listTimeSlots(): Promise<TimeSlot[]> {
  try {
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

export async function updateTimeSlot(
  id: string,
  patch: Partial<TimeSlot>
): Promise<TimeSlot | null> {
  try {
    const docRef = doc(db, "time_slots", id);
    const updateData: any = {
      ...patch,
      updatedAt: Timestamp.now(),
    };

    // Remove id from update payload
    delete updateData.id;
    delete updateData.createdAt;

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

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "expiresAt">
): Promise<Appointment> {
  try {
    const aptsRef = collection(db, "appointments");
    const now = Timestamp.now();
    const expiresAt = new Date(now.toDate());
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

    // Build Firestore-safe payload (no undefined values)
    const payload: any = {
      slotId: data.slotId,
      email: data.email,
      locationDetails: {
        type: data.locationDetails?.type,
      },
      status: data.status,
      appointmentDate: data.appointmentDate,
      createdAt: now,
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    if (data.locationDetails?.details) {
      payload.locationDetails.details = data.locationDetails.details;
    }

    if (data.notes) {
      payload.notes = data.notes;
    }

    const docRef = await addDoc(aptsRef, payload);

    return {
      id: docRef.id,
      ...data,
      createdAt: now.toDate(),
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

export async function updateAppointment(
  id: string,
  patch: Partial<Appointment>
): Promise<Appointment | null> {
  try {
    const docRef = doc(db, "appointments", id);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (patch.slotId !== undefined) updateData.slotId = patch.slotId;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.appointmentDate !== undefined) updateData.appointmentDate = patch.appointmentDate;
    if (patch.notes !== undefined) updateData.notes = patch.notes;

    if (patch.locationDetails) {
      updateData.locationDetails = { type: patch.locationDetails.type };
      if (patch.locationDetails.details) {
        updateData.locationDetails.details = patch.locationDetails.details;
      }
    }

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
  startHour: number; // 0-23
  endHour: number;   // 0-23
};

export type WorkingDays = {
  startDay: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  endDay: number;   // 0=Sunday, 1=Monday, ..., 6=Saturday
};

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

export type Settings = {
  id?: string;
  workingHours: WorkingHours;
  workingDays: WorkingDays;
  blockedSlots: BlockedSlot[];
  oneOffUnavailableSlots: UnavailableSlot[];
  updatedAt?: Date;
  calendarSync: CalendarSync;
};

const SETTINGS_DOC = "main";

export async function getSettings(): Promise<Settings> {
  try {
    const settingsRef = doc(db, "settings", SETTINGS_DOC);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        id: settingsDoc.id,
        workingHours: data.workingHours || { startHour: 9, endHour: 17 },
        workingDays: data.workingDays || { startDay: 1, endDay: 5 },
        blockedSlots: data.blockedSlots || [],
        oneOffUnavailableSlots: data.oneOffUnavailableSlots || [],
        updatedAt: data.updatedAt?.toDate() || new Date(),
        calendarSync: data.calendarSync || {
          autoCreateEvents: true,
          showBusyTimes: false,
          syncCancellations: true,
        },
      };
    } else {
      // Return default settings if not found
      return {
        workingHours: { startHour: 9, endHour: 17 },
        workingDays: { startDay: 1, endDay: 5 },
        blockedSlots: [],
        oneOffUnavailableSlots: [],
        calendarSync: {
          autoCreateEvents: true,
          showBusyTimes: false,
          syncCancellations: true,
        },
      };
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return default settings on error
    return {
      workingHours: { startHour: 9, endHour: 17 },
      workingDays: { startDay: 1, endDay: 5 },
      blockedSlots: [],
      oneOffUnavailableSlots: [],
    };
  }
}

export async function updateSettings(settings: Settings): Promise<boolean> {
  try {
    const settingsRef = doc(db, "settings", SETTINGS_DOC);
    await setDoc(settingsRef, {
      workingHours: settings.workingHours,
      workingDays: settings.workingDays,
      blockedSlots: settings.blockedSlots,
      oneOffUnavailableSlots: settings.oneOffUnavailableSlots || [],
      calendarSync: settings.calendarSync || {
        autoCreateEvents: true,
        showBusyTimes: false,
        syncCancellations: true,
      },
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    return false;
  }
}
