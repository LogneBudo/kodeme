export const SlotState = {
  Past: "past",
  CalendarBlocked: "calendarBlocked",
  Blocked: "blocked",
  Booked: "booked",
  Unavailable: "unavailable",
  Available: "available",
} as const;

export type SlotState = (typeof SlotState)[keyof typeof SlotState];

export const slotStateDisplay: Record<SlotState, { label: string; icon: string }> = {
  [SlotState.Past]: { label: "Past", icon: "—" },
  [SlotState.CalendarBlocked]: { label: "Calendar blocked", icon: "X" },
  [SlotState.Blocked]: { label: "Blocked", icon: "X" },
  [SlotState.Booked]: { label: "Booked", icon: "✓" },
  [SlotState.Unavailable]: { label: "Unavailable", icon: "✕" },
  [SlotState.Available]: { label: "Available", icon: "✓" },
};

export const slotStateClassMap: Record<SlotState, string> = {
  [SlotState.Past]: "slotPast",
  [SlotState.CalendarBlocked]: "slotCalendarBlocked",
  [SlotState.Blocked]: "slotBlocked",
  [SlotState.Booked]: "slotBooked",
  [SlotState.Unavailable]: "slotUnavailable",
  [SlotState.Available]: "slotAvailable",
};
