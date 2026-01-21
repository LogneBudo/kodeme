import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  where,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./../../firebase";
import type { Appointment } from "../../types/appointment";
import type { TimeSlot } from "../../types/timeSlot";

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
    const err = error as unknown;
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: unknown }).code === "failed-precondition"
    || message.includes("requires an index")) {
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
