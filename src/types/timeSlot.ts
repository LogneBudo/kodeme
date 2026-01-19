export type TimeSlot = {
  id: string;
  org_id?: string; // MULTI-TENANCY: Which organization owns this slot (optional during Phase 1)
  calendar_id?: string; // MULTI-TENANCY: Which calendar this slot belongs to (optional during Phase 1)
  date: string; // ISO date string "2025-01-15"
  time: string; // "09:00"
  status: "available" | "booked";
  createdAt: Date;
  updatedAt: Date;
};