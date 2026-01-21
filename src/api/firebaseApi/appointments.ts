import API_BASE_URL from '../../config/api';
import type { Appointment } from "../../types/appointment";
import type { TimeSlot } from "../../types/timeSlot";

// ============ APPOINTMENTS ============

export async function listAppointments(): Promise<Appointment[]> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error listing appointments: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return (json.appointments || []) as Appointment[];
  } catch (error) {
    console.error("Error fetching appointments (client->backend):", error);
    return [];
  }
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`);
    if (!resp.ok) {
      if (resp.status === 404) return null;
      const text = await resp.text();
      throw new Error(`Backend error fetching appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment | null;
  } catch (error) {
    console.error("Error fetching appointment (client->backend):", error);
    return null;
  }
}

// Fix createAppointment
export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "expiresAt">
): Promise<Appointment> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: data }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error creating appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment;
  } catch (error) {
    console.error("Error creating appointment (client->backend):", error);
    throw error;
  }
}

// Atomic booking: create appointment + mark slot as booked in a single transaction
export async function createAppointmentWithSlot(
  appointmentData: Omit<Appointment, "id" | "createdAt" | "expiresAt">,
  slotId: string
): Promise<Appointment> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments/with-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment: appointmentData, slotId }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error creating appointment with slot: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment;
  } catch (error) {
    console.error("Error creating appointment with slot (client->backend):", error);
    throw error;
  }
}

// Fix updateAppointment
export async function updateAppointment(
  id: string,
  patch: Partial<Appointment>
): Promise<Appointment | null> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: patch }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error updating appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment | null;
  } catch (error) {
    console.error("Error updating appointment (client->backend):", error);
    return null;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error deleting appointment: ${resp.status} ${text}`);
    }
    return true;
  } catch (error) {
    console.error("Error deleting appointment (client->backend):", error);
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
    const resp = await fetch(`${API_BASE_URL}/appointments?date=${encodeURIComponent(date)}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error listing appointments by date: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return (json.appointments || []) as Appointment[];
  } catch (error) {
    console.error("Error fetching appointments by date (client->backend):", error);
    return [];
  }
}

/**
 * Get all slots for a specific date
 */
export async function getSlotsByDate(date: string): Promise<TimeSlot[]> {
  try {
    const resp = await fetch(`${API_BASE_URL}/time-slots?date=${encodeURIComponent(date)}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error listing slots by date: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    const slots = (json.slots || []) as TimeSlot[];
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.error("Error fetching slots by date (client->backend):", error);
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
    const resp = await fetch(
      `${API_BASE_URL}/appointments?orgId=${encodeURIComponent(orgId)}&calendarId=${encodeURIComponent(calendarId)}`
    );
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error listing tenant appointments: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return (json.appointments || []) as Appointment[];
  } catch (error) {
    console.error(
      `Error fetching tenant appointments (client->backend) for org=${orgId}, branch=${calendarId}:`,
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
    const resp = await fetch(
      `${API_BASE_URL}/appointments/${encodeURIComponent(id)}?orgId=${encodeURIComponent(orgId)}&calendarId=${encodeURIComponent(calendarId)}`
    );
    if (!resp.ok) {
      if (resp.status === 404) return null;
      const text = await resp.text();
      throw new Error(`Backend error fetching appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment | null;
  } catch (error) {
    console.error(
      `Error fetching tenant appointment (client->backend) ${id} for org=${orgId}, branch=${calendarId}:`,
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
  // Route through the backend so secrets and Admin SDK usage remain server-side
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, calendarId, appointment: data }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error creating appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment;
  } catch (error) {
    console.error(`Error creating appointment (client -> backend) for org=${orgId}, branch=${calendarId}:`, error);
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
  // Route through the backend so the atomic booking occurs server-side
  try {
    const resp = await fetch(`${API_BASE_URL}/appointments/with-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, calendarId, appointment: appointmentData, slotId }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error creating appointment with slot: ${resp.status} ${text}`);
    }

    const json = await resp.json();
    return json.appointment as Appointment;
  } catch (error) {
    console.error(
      `Error creating tenant appointment with slot (client -> backend) for org=${orgId}, branch=${calendarId}:`,
      error
    );
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
    const resp = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, calendarId, updates: patch }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error updating appointment: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.appointment as Appointment | null;
  } catch (error) {
    console.error(
      `Error updating tenant appointment (client->backend) ${id} for org=${orgId}, branch=${calendarId}:`,
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
    // Route through backend which should verify ownership and perform deletion
    const resp = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, calendarId }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error deleting appointment: ${resp.status} ${text}`);
    }
    return true;
  } catch (error) {
    console.error(
      `Error deleting tenant appointment (client->backend) ${id} for org=${orgId}, branch=${calendarId}:`,
      error
    );
    throw error;
  }
}
