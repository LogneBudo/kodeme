import type { Appointment } from "../types/appointment";
import { API_ENDPOINTS } from "../config/api";

// Generate ICS (iCalendar) format for appointment
function generateICS(appointment: Appointment): string {
  const dateTime = `${appointment.date.replace(/-/g, "")}T${appointment.time.replace(/:/g, "")}00`;
  const eventId = `${appointment.id}@appointments.local`;
  const created = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];

  // Determine location string
  let location = "";
  switch (appointment.location_type) {
    case "zoom":
      location = "Zoom Meeting";
      break;
    case "your_premises":
      location = appointment.location_details || "Your Premises";
      break;
    case "restaurant":
      location = appointment.location_details || "Restaurant";
      break;
    case "other":
      location = appointment.location_details || "Custom Location";
      break;
  }

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Appointments//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${created}Z
DTSTART:${dateTime}
DTEND:${dateTime}Z
SUMMARY:Appointment Confirmation
DESCRIPTION:Your appointment has been confirmed.
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return ics;
}

// Send confirmation email with ICS attachment
export async function sendBookingConfirmation(appointment: Appointment): Promise<boolean> {
  try {
    const icsContent = generateICS(appointment);

    console.log("Sending booking confirmation email to:", appointment.email);

    // Call the backend email service
    const response = await fetch(API_ENDPOINTS.BOOKING_CONFIRMATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: appointment.email,
        appointment,
        icsContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send email");
    }

    await response.json();
    console.log("✓ Confirmation email sent successfully to", appointment.email);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}
