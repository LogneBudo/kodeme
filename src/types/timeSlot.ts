export type TimeSlot = {
  id: string;
  date: string; // ISO date string "2025-01-15"
  time: string; // "09:00"
  status: "available" | "booked";
  createdAt: Date;
  updatedAt: Date;
};