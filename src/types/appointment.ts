export type Appointment = {
  id: string;
  org_id?: string; // MULTI-TENANCY: Which organization owns this appointment (optional during Phase 1)
  calendar_id?: string; // MULTI-TENANCY: Which calendar this appointment belongs to (optional during Phase 1)
  slotId: string; // Reference to TimeSlot
  email: string;
  locationDetails: {
    type: "zoom" | "your_premises" | "restaurant" | "other";
    details?: string;
  };
  status: "pending" | "confirmed" | "cancelled";
  appointmentDate: string; // ISO date for cleanup queries
  createdAt: Date;
  expiresAt: Date; // 90 days from creation
  notes?: string;
  // For display purposes (added from slot)
  time?: string;
  date?: string;
};
