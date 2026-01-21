import { Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase";

export type WorkingHours = {
  startTime: string;
  endTime: string;
};
export type WorkingDays = number[];
export type BlockedSlot = {
  _key: string;
  date?: string;
  startTime: string;
  endTime: string;
  label: string;
};
export type UnavailableSlot = {
  date: string;
  time: string;
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
  restaurantCity?: string;
  restaurantCountry?: string;
  restaurantPerimeterKm?: number;
  restaurants?: Record<string, unknown>[];
  curatedList?: string;
};

const SETTINGS_DOC = "main";
const DEFAULT_WORKING_DAYS: WorkingDays = [1, 2, 3, 4, 5];

function normalizeWorkingDays(raw: unknown): WorkingDays {
  if (Array.isArray(raw)) {
    const days = Array.from(new Set(raw.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b);
    return days.length > 0 ? days : DEFAULT_WORKING_DAYS;
  }
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

export async function getSettings() {
  const settingsRef = db.collection("settings").doc(SETTINGS_DOC);
  const settingsDoc = await settingsRef.get();
  if (settingsDoc.exists) {
    const data = settingsDoc.data();
    return {
      id: settingsDoc.id,
      workingHours: data?.workingHours || { startTime: "09:00", endTime: "17:00" },
      workingDays: normalizeWorkingDays(data?.workingDays),
      blockedSlots: data?.blockedSlots || [],
      oneOffUnavailableSlots: data?.oneOffUnavailableSlots || [],
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      calendarSync: data?.calendarSync || {
        autoCreateEvents: true,
        showBusyTimes: false,
        syncCancellations: true,
      },
      restaurantCity: data?.restaurantCity || "",
      restaurantCountry: data?.restaurantCountry || "",
      restaurantPerimeterKm: data?.restaurantPerimeterKm || 5,
      restaurants: data?.restaurants || [],
      curatedList: data?.curatedList || "",
    };
  } else {
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
}

export async function updateSettings(settings: Settings) {
  const settingsRef = db.collection("settings").doc(SETTINGS_DOC);
  await settingsRef.set({
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
}

export async function getTenantSettings(orgId: string, calendarId: string) {
  if (!orgId || !calendarId) throw new Error("orgId and calendarId are required");
  const settingsKey = `${orgId}_${calendarId}`;
  const settingsRef = db.collection("settings").doc(settingsKey);
  const settingsDoc = await settingsRef.get();
  if (settingsDoc.exists) {
    const data = settingsDoc.data();
    return {
      id: settingsDoc.id,
      workingHours: data?.workingHours || { startTime: "09:00", endTime: "17:00" },
      workingDays: normalizeWorkingDays(data?.workingDays),
      blockedSlots: data?.blockedSlots || [],
      oneOffUnavailableSlots: data?.oneOffUnavailableSlots || [],
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      calendarSync: data?.calendarSync || {
        autoCreateEvents: true,
        showBusyTimes: false,
        syncCancellations: true,
      },
      restaurantCity: data?.restaurantCity || "",
      restaurantCountry: data?.restaurantCountry || "",
      restaurantPerimeterKm: data?.restaurantPerimeterKm || 5,
      restaurants: data?.restaurants || [],
      curatedList: data?.curatedList || "",
    };
  } else {
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
}

export async function updateTenantSettings(orgId: string, calendarId: string, settings: Settings) {
  if (!orgId || !calendarId) throw new Error("orgId and calendarId are required");
  const settingsKey = `${orgId}_${calendarId}`;
  const settingsRef = db.collection("settings").doc(settingsKey);
  await settingsRef.set({
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
}
