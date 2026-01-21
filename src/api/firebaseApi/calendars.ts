import API_BASE_URL from '../../config/api';
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
    const resp = await fetch(`${API_BASE_URL}/calendars?orgId=${encodeURIComponent(orgId)}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error listing calendars: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return (json.calendars || []) as Calendar[];
  } catch (error) {
    console.error(`Error listing calendars for org=${orgId} (client->backend):`, error);
    throw error;
  }
}

// Lightweight fetch by calendar ID without org ownership checks; useful for diagnostics/fallback UI.
export async function getCalendarUnsafe(calendarId: string): Promise<Calendar | null> {
  if (!calendarId) return null;
  try {
    const resp = await fetch(`${API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}`);
    if (!resp.ok) {
      if (resp.status === 404) return null;
      const text = await resp.text();
      throw new Error(`Backend error fetching calendar: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.calendar as Calendar | null;
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
    const resp = await fetch(
      `${API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}?orgId=${encodeURIComponent(orgId)}`
    );
    if (!resp.ok) {
      if (resp.status === 404) return null;
      const text = await resp.text();
      throw new Error(`Backend error fetching calendar: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.calendar as Calendar | null;
  } catch (error) {
    console.error(`Error getting calendar ${calendarId} for org=${orgId} (client->backend):`, error);
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
    const resp = await fetch(`${API_BASE_URL}/calendars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, userId, calendar: data }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error creating calendar: ${resp.status} ${text}`);
    }

    const json = await resp.json();
    return json.calendar as Calendar;
  } catch (error) {
    console.error(`Error creating calendar (client -> backend) for org=${orgId}:`, error);
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
    const resp = await fetch(`${API_BASE_URL}/calendars/${calendarId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, updates }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error updating calendar: ${resp.status} ${text}`);
    }

    const json = await resp.json();
    return json.calendar as Calendar;
  } catch (error) {
    console.error(`Error updating calendar (client -> backend) ${calendarId} for org=${orgId}:`, error);
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
    const resp = await fetch(`${API_BASE_URL}/calendars/${calendarId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Backend error deleting calendar: ${resp.status} ${text}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting calendar (client -> backend) ${calendarId} for org=${orgId}:`, error);
    throw error;
  }
}
