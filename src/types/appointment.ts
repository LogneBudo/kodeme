export type Appointment = {
  id: string;
  date: string;
  time: string;
  email: string;
  location_type: "zoom" | "your_premises" | "restaurant" | "other";
  location_details?: string;

  // Add these:
  slot_id: string;
  status: "confirmed" | "pending" | "cancelled";
};