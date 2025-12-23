export type Appointment = {
  id: string;
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
