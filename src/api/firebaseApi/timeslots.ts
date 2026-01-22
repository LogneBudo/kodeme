import type { TimeSlot } from "../../types/timeSlot";

const API_BASE = "/api";

export async function listTimeSlots(): Promise<TimeSlot[]> {
  const resp = await fetch(`${API_BASE}/timeslots`);
  if (!resp.ok) throw new Error('Failed to list time slots');
  return resp.json();
}

export async function getTimeSlot(id: string): Promise<TimeSlot | null> {
  const resp = await fetch(`${API_BASE}/timeslots/${encodeURIComponent(id)}`);
  if (!resp.ok) return null;
  return resp.json();
}

export async function createTimeSlot(data: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeSlot> {
  const resp = await fetch(`${API_BASE}/timeslots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) throw new Error('Failed to create time slot');
  return resp.json();
}

export async function updateTimeSlot(id: string, patch: Partial<TimeSlot>): Promise<TimeSlot | null> {
  const resp = await fetch(`${API_BASE}/timeslots/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  if (!resp.ok) return null;
  return resp.json();
}

export async function deleteTimeSlot(id: string): Promise<boolean> {
  const resp = await fetch(`${API_BASE}/timeslots/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return resp.ok;
}

export async function bulkCreateTimeSlots(data: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<TimeSlot[]> {
  // backend currently does not expose a bulk endpoint; fallback to multiple creates
  const created: TimeSlot[] = [];
  for (const item of data) {
    const c = await createTimeSlot(item);
    created.push(c);
  }
  return created;
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
    const err = error as unknown;
    let code: string | undefined;
    let message: string = "";
    if (typeof err === "object" && err !== null) {
      code = (err as { code?: string }).code;
      message = String((err as { message?: string }).message ?? "");
    }
    // Fallback if index missing or other query failure: fetch all, filter client-side
    if (code === "failed-precondition" || message.includes("requires an index")) {
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
