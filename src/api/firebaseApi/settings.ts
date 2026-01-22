// import API_BASE_URL from your config if needed
const API_BASE_URL = "/api";
import type { Restaurant } from "../../types/restaurant";

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
    const resp = await fetch(`${API_BASE_URL}/settings`);
    if (!resp.ok) throw new Error("Failed to fetch settings");
    const data = await resp.json() as Settings;
    const rawWorkingDays = (data as unknown as { workingDays?: unknown }).workingDays;
    data.workingDays = normalizeWorkingDays(rawWorkingDays);
    return data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
}

export async function updateSettings(settings: Settings): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!resp.ok) throw new Error("Failed to update settings");
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    return false;
  }
}

// ============ PHASE 2.3: SETTINGS (TENANT-AWARE) ============

/**
 * Get settings for a specific org/branch
 * Settings are stored with key format: {orgId}_{calendarId}
 */
export async function getTenantSettings(orgId: string, calendarId: string): Promise<Settings> {
  if (!orgId || !calendarId) throw new Error("orgId and calendarId are required");
  try {
    const resp = await fetch(`${API_BASE_URL}/settings/${orgId}/${calendarId}`);
    if (!resp.ok) throw new Error("Failed to fetch tenant settings");
    const data = await resp.json() as Settings;
    const rawWorkingDays = (data as unknown as { workingDays?: unknown }).workingDays;
    data.workingDays = normalizeWorkingDays(rawWorkingDays);
    return data;
  } catch (error) {
    console.error(`Error fetching settings for org=${orgId}, branch=${calendarId}:`, error);
    throw error;
  }
}

/**
 * Update settings for a specific org/branch
 */
export async function updateTenantSettings(orgId: string, calendarId: string, settings: Settings): Promise<boolean> {
  if (!orgId || !calendarId) throw new Error("orgId and calendarId are required");
  try {
    const resp = await fetch(`${API_BASE_URL}/settings/${orgId}/${calendarId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!resp.ok) throw new Error("Failed to update tenant settings");
    return true;
  } catch (error) {
    console.error(`Error updating settings for org=${orgId}, branch=${calendarId}:`, error);
    throw error;
  }
}
