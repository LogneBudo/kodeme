import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";

let timeSlots: TimeSlot[] = [];
const appointments: Appointment[] = [];

// Load slots from localStorage
function loadSlotsFromStorage(): TimeSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("timeSlots");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Persist slots to localStorage
function persistSlots(): void {
  if (typeof window === "undefined") {
    console.log("Window undefined, skipping persist");
    return;
  }
  try {
    const data = JSON.stringify(timeSlots);
    localStorage.setItem("timeSlots", data);
    console.log("Persisted to localStorage, data length:", data.length);
  } catch (error) {
    console.error("Failed to persist slots:", error);
  }
}

// Initialize timeSlots from localStorage when module loads
timeSlots = loadSlotsFromStorage();

export async function listTimeSlots(): Promise<TimeSlot[]> {
  // Refresh from localStorage to get latest data
  timeSlots = loadSlotsFromStorage();
  await new Promise((res) => setTimeout(res, 100));
  return [...timeSlots];
}

export async function listAppointments(): Promise<Appointment[]> {
  await new Promise((res) => setTimeout(res, 100));
  return [...appointments];
}

export async function updateTimeSlot(
  id: string,
  patch: Partial<TimeSlot>
): Promise<TimeSlot | null> {
  await new Promise((res) => setTimeout(res, 100));
  console.log(`Updating slot ${id} with:`, patch);
  const index = timeSlots.findIndex((s) => s.id === id);
  console.log(`Found slot at index: ${index}, current state:`, timeSlots[index]);
  if (index === -1) {
    console.error(`Slot ${id} not found!`);
    return null;
  }
  timeSlots[index] = { ...timeSlots[index], ...patch };
  console.log(`Updated slot:`, timeSlots[index]);
  persistSlots();
  console.log(`Persisted. Current timeSlots:`, timeSlots);
  return timeSlots[index];
}

export async function createTimeSlot(
  data: Omit<TimeSlot, "id">
): Promise<TimeSlot> {
  await new Promise((res) => setTimeout(res, 100));
  const slot: TimeSlot = {
    id: `slot_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ...data,
    status: data.status || "unavailable",
  };
  timeSlots.push(slot);
  persistSlots();
  return slot;
}

export async function bulkCreateTimeSlots(
  data: Omit<TimeSlot, "id">[]
): Promise<TimeSlot[]> {
  await new Promise((res) => setTimeout(res, 100));
  const created = data.map((d) => ({
    id: `slot_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    ...d,
    status: d.status || "unavailable",
  }));
  timeSlots = [...timeSlots, ...created];
  persistSlots();
  return created;
}
