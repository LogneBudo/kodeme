import {
  getDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./../../firebase";
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
