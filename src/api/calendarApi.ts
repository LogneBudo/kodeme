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
    // TODO: Implement actual OAuth2 calls to Google Calendar and Outlook Calendar APIs
    // For now, return empty array - this will be populated once calendar auth is integrated
    
    const response = await fetch(`${API_BASE}/api/calendar/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch calendar events");
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
    let eventStart: Date;
    let eventEnd: Date;

    // Handle all-day events (only 'date' field, no 'dateTime')
    if (typeof event.startTime === 'string' && (event.startTime as string).length === 10) {
      // Format: YYYY-MM-DD (all-day event)
      eventStart = new Date(event.startTime + 'T00:00:00Z');
      eventEnd = new Date(event.endTime + 'T23:59:59Z');
    } else {
      // Format: ISO 8601 datetime (timed event)
      eventStart = new Date(event.startTime as any);
      eventEnd = new Date(event.endTime as any);
    }

    // If event starts before slot ends AND event ends after slot starts, there's an overlap
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
