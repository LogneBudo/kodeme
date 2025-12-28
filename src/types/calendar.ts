export type CalendarEvent = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
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
