// Events returned from API use ISO strings. Normalize on read when needed.
export type CalendarEvent = {
  id: string;
  title: string;
  // ISO 8601 datetime (e.g., 2025-12-31T10:30:00Z) or date-only (YYYY-MM-DD for all-day)
  startTime: string;
  endTime: string;
  provider: "google" | "outlook";
};

export type CalendarProvider = {
  name: "google" | "outlook";
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  calendarId?: string;
  isConnected: boolean;
};
