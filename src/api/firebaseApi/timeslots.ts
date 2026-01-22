import type { TimeSlot } from "../../types/timeSlot";
import API_BASE_URL from '../../config/api';

export async function listTimeSlots(): Promise<TimeSlot[]> {
  const resp = await fetch(`${API_BASE_URL}/timeslots`);
  if (!resp.ok) throw new Error('Failed to list time slots');
  return resp.json();
}

export async function getTimeSlot(id: string): Promise<TimeSlot | null> {
  const resp = await fetch(`${API_BASE_URL}/timeslots/${encodeURIComponent(id)}`);
  if (!resp.ok) return null;
  return resp.json();
}

export async function createTimeSlot(data: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeSlot> {
  const resp = await fetch(`${API_BASE_URL}/timeslots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) throw new Error('Failed to create time slot');
  return resp.json();
}

export async function updateTimeSlot(id: string, patch: Partial<TimeSlot>): Promise<TimeSlot | null> {
  const resp = await fetch(`${API_BASE_URL}/timeslots/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  if (!resp.ok) return null;
  return resp.json();
}

export async function deleteTimeSlot(id: string): Promise<boolean> {
  const resp = await fetch(`${API_BASE_URL}/timeslots/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  const resp = await fetch(`${API_BASE_URL}/timeslots/tenant/${encodeURIComponent(orgId)}/${encodeURIComponent(calendarId)}`);
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to list tenant time slots: ${resp.status} ${text}`);
  }
  return resp.json();
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
  const resp = await fetch(`${API_BASE_URL}/timeslots/tenant/${encodeURIComponent(orgId)}/${encodeURIComponent(calendarId)}/${encodeURIComponent(id)}`);
  if (!resp.ok) {
    if (resp.status === 404) return null;
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to get tenant time slot: ${resp.status} ${text}`);
  }
  return resp.json();
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
  const resp = await fetch(`${API_BASE_URL}/timeslots/tenant/${encodeURIComponent(orgId)}/${encodeURIComponent(calendarId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to create tenant time slot: ${resp.status} ${text}`);
  }
  return resp.json();
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
  const resp = await fetch(`${API_BASE_URL}/timeslots/tenant/${encodeURIComponent(orgId)}/${encodeURIComponent(calendarId)}/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  if (!resp.ok) {
    if (resp.status === 404) return null;
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to update tenant time slot: ${resp.status} ${text}`);
  }
  return resp.json();
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
  const resp = await fetch(`${API_BASE_URL}/timeslots/tenant/${encodeURIComponent(orgId)}/${encodeURIComponent(calendarId)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to delete tenant time slot: ${resp.status} ${text}`);
  }
  return true;
}
