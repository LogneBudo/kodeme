import type { CalendarEvent } from "../types/calendar";

// Default to same-origin /api in hosted environments. For local dev without `vercel dev`,
// set VITE_BACKEND_URL=http://localhost:3001 in .env.local to point to a local server.
const API_BASE = import.meta.env.VITE_BACKEND_URL ?? "";

// Fetch calendar events for a given date range
// This would be implemented with actual OAuth calls to Google/Outlook APIs
export async function getCalendarEventsForWeek(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(`${API_BASE}/api/calendar/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    // If calendar not connected (401), return empty array silently
    if (response.status === 401) {
      return [];
    }

    if (!response.ok) {
      console.error("Failed to fetch calendar events:", response.status);
      return [];
    }

    const data = await response.json();
    const events: CalendarEvent[] = data?.events ?? [];
    return events;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
}

// Check if a specific time slot overlaps with any calendar events
export function isTimeSlotBlocked(
  slotDate: Date,
  slotTime: string,
  slotDuration: number = 30, // default 30 minutes
  calendarEvents: CalendarEvent[]
): boolean {
  // Parse slot time (HH:MM format)
  const [hours, minutes] = slotTime.split(":").map(Number);
  const slotStart = new Date(slotDate);
  slotStart.setHours(hours, minutes, 0, 0);

  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

  // Check if any calendar event overlaps with this slot
  return calendarEvents.some((event) => {
    const isDateOnly = event.startTime.length === 10 && event.endTime.length === 10;
    const eventStart = isDateOnly
      ? new Date(`${event.startTime}T00:00:00Z`)
      : new Date(event.startTime);
    const eventEnd = isDateOnly
      ? new Date(`${event.endTime}T23:59:59Z`)
      : new Date(event.endTime);

    return eventStart < slotEnd && eventEnd > slotStart;
  });
}

// Get calendar events that block specific slots
export function getBlockedSlotsByCalendar(
  slots: Array<{ id: string; date: string; time: string }>,
  calendarEvents: CalendarEvent[]
): string[] {
  return slots
    .filter((slot) => {
      const slotDate = new Date(slot.date);
      return isTimeSlotBlocked(slotDate, slot.time, 30, calendarEvents);
    })
    .map((slot) => slot.id);
}
