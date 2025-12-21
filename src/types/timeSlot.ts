export type TimeSlot = {
  id: string;          // unique identifier for the time slot
  date: string;          // ISO date string, e.g. "2025-01-10"
  time: string;          // "09:00", "14:30"
  status?: "available" | "unavailable" | "booked"; // defaults to "available" if omitted
};